-- Core live modules: orders, weekly plans, attendance, and cash books.
-- Run this entire file once in the Supabase SQL Editor.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_name text not null,
  amount numeric(14,2) not null check (amount >= 0),
  platform text not null,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  week_start date not null,
  primary_goal text not null,
  prospecting_target text,
  attendance_goal text,
  expected_outcome text,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  review_rating text check (review_rating in ('good','poor') or review_rating is null),
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  edit_count integer not null default 0 check (edit_count between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  attendance_date date not null default current_date,
  status text not null check (status in ('present','late','absent')),
  excuse_category text,
  comment text,
  checked_in_at timestamptz,
  excuse_status text check (excuse_status in ('pending','approved','rejected') or excuse_status is null),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, attendance_date),
  check (status <> 'absent' or (excuse_category is not null and comment is not null))
);

create table if not exists public.cash_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  currency text not null check (currency in ('NGN','USD')),
  visibility text not null default 'personal' check (visibility in ('personal','office')),
  created_at timestamptz not null default now(),
  unique (owner_id, name, currency)
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.cash_books(id) on delete cascade,
  entry_type text not null check (entry_type in ('credit','debit')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null,
  transaction_date date not null default current_date,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_transaction_history (
  id bigint generated always as identity primary key,
  transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null default auth.uid(),
  old_value jsonb not null,
  new_value jsonb not null,
  changed_at timestamptz not null default now()
);

create or replace function public.can_view_member(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select target_user_id = auth.uid()
    or public.current_role() = 'admin'
    or (public.current_role() = 'team_leader' and exists (
      select 1 from public.office_memberships m
      where m.user_id = target_user_id and m.office_id = public.current_office_id() and m.ended_at is null
    ));
$$;

alter table public.orders enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.attendance enable row level security;
alter table public.cash_books enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.cash_transaction_history enable row level security;

drop policy if exists "orders readable by hierarchy" on public.orders;
create policy "orders readable by hierarchy" on public.orders for select using (public.can_view_member(user_id));
drop policy if exists "members create own orders" on public.orders;
create policy "members create own orders" on public.orders for insert with check (user_id = auth.uid());
drop policy if exists "members update own orders" on public.orders;
create policy "members update own orders" on public.orders for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "plans readable by hierarchy" on public.weekly_plans;
create policy "plans readable by hierarchy" on public.weekly_plans for select using (public.can_view_member(user_id));
drop policy if exists "members create own plans" on public.weekly_plans;
create policy "members create own plans" on public.weekly_plans for insert with check (user_id = auth.uid());
drop policy if exists "members update own plans" on public.weekly_plans;
create policy "members update own plans" on public.weekly_plans for update using (user_id = auth.uid() and edit_count < 3) with check (user_id = auth.uid() and edit_count <= 3);

drop policy if exists "attendance readable by hierarchy" on public.attendance;
create policy "attendance readable by hierarchy" on public.attendance for select using (public.can_view_member(user_id));

drop policy if exists "books readable by permission" on public.cash_books;
create policy "books readable by permission" on public.cash_books for select using (
  owner_id = auth.uid() or public.current_role() = 'admin'
  or (visibility = 'office' and public.current_role() = 'team_leader' and public.can_view_member(owner_id))
);
drop policy if exists "members create own books" on public.cash_books;
create policy "members create own books" on public.cash_books for insert with check (owner_id = auth.uid());
drop policy if exists "transactions readable through book" on public.cash_transactions;
create policy "transactions readable through book" on public.cash_transactions for select using (
  exists (select 1 from public.cash_books b where b.id = book_id)
);
drop policy if exists "owners add transactions" on public.cash_transactions;
create policy "owners add transactions" on public.cash_transactions for insert with check (
  exists (select 1 from public.cash_books b where b.id = book_id and b.owner_id = auth.uid())
);
drop policy if exists "owners update transactions" on public.cash_transactions;
create policy "owners update transactions" on public.cash_transactions for update using (
  exists (select 1 from public.cash_books b where b.id = book_id and b.owner_id = auth.uid())
);
drop policy if exists "history readable through transaction" on public.cash_transaction_history;
create policy "history readable through transaction" on public.cash_transaction_history for select using (
  exists (select 1 from public.cash_transactions t join public.cash_books b on b.id = t.book_id where t.id = transaction_id)
);

create or replace function public.submit_attendance(
  attendance_status text,
  attendance_note text default null,
  absence_category text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare result_id uuid; office uuid;
begin
  office := public.current_office_id();
  if office is null then raise exception 'You do not have an active office assignment'; end if;
  if attendance_status not in ('present','late','absent') then raise exception 'Invalid attendance status'; end if;
  if attendance_status = 'absent' and (nullif(absence_category,'') is null or nullif(attendance_note,'') is null) then
    raise exception 'An excuse category and explanation are required';
  end if;
  insert into public.attendance (user_id, office_id, status, excuse_category, comment, checked_in_at, excuse_status)
  values (auth.uid(), office, attendance_status, nullif(absence_category,''), nullif(attendance_note,''),
    case when attendance_status in ('present','late') then now() end,
    case when attendance_status = 'absent' then 'pending' end)
  on conflict (user_id, attendance_date) do update set
    status = excluded.status, excuse_category = excluded.excuse_category, comment = excluded.comment,
    checked_in_at = excluded.checked_in_at, excuse_status = excluded.excuse_status, updated_at = now()
  returning id into result_id;
  return result_id;
end; $$;

create or replace function public.add_default_book_transaction(
  transaction_type text, transaction_amount numeric, transaction_description text,
  transaction_day date default current_date, transaction_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare selected_book uuid; result_id uuid;
begin
  if transaction_type not in ('credit','debit') then raise exception 'Invalid entry type'; end if;
  insert into public.cash_books (owner_id, name, currency, visibility)
  values (auth.uid(), 'Personal book', 'NGN', 'personal')
  on conflict (owner_id, name, currency) do nothing;
  select id into selected_book from public.cash_books
  where owner_id = auth.uid() and name = 'Personal book' and currency = 'NGN';
  insert into public.cash_transactions (book_id, entry_type, amount, description, transaction_date, notes)
  values (selected_book, transaction_type, transaction_amount, transaction_description, transaction_day, nullif(transaction_notes,''))
  returning id into result_id;
  return result_id;
end; $$;

create or replace function public.audit_cash_transaction_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cash_transaction_history (transaction_id, old_value, new_value)
  values (old.id, to_jsonb(old), to_jsonb(new));
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists cash_transaction_audit on public.cash_transactions;
create trigger cash_transaction_audit before update on public.cash_transactions
for each row execute function public.audit_cash_transaction_update();

grant execute on function public.submit_attendance(text,text,text) to authenticated;
grant execute on function public.add_default_book_transaction(text,numeric,text,date,text) to authenticated;

