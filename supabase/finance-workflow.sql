-- Multi-book Finance and withdrawal recording.
-- Run this file once in the Supabase SQL Editor.

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  book_id uuid not null references public.cash_books(id) on delete restrict,
  transaction_id uuid not null references public.cash_transactions(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency in ('NGN','USD')),
  notes text,
  recorded_at timestamptz not null default now()
);

alter table public.withdrawals enable row level security;
drop policy if exists "withdrawals readable by permission" on public.withdrawals;
create policy "withdrawals readable by permission" on public.withdrawals for select using (
  user_id = auth.uid()
  or public.current_role() = 'admin'
  or exists (
    select 1 from public.cash_books book
    where book.id = book_id
      and book.visibility = 'office'
      and public.current_role() = 'team_leader'
      and public.can_view_member(book.owner_id)
  )
);

create or replace function public.create_finance_book(
  book_name text,
  book_currency text,
  book_visibility text default 'personal'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare result_id uuid;
begin
  if nullif(trim(book_name), '') is null then raise exception 'Book name is required'; end if;
  if book_currency not in ('NGN','USD') then raise exception 'Currency must be NGN or USD'; end if;
  if book_visibility not in ('personal','office') then raise exception 'Visibility must be personal or office'; end if;

  insert into public.cash_books(owner_id,name,currency,visibility)
  values(auth.uid(),trim(book_name),book_currency,book_visibility)
  returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.add_finance_transaction(
  target_book_id uuid,
  transaction_type text,
  transaction_amount numeric,
  transaction_description text,
  transaction_day date default current_date,
  transaction_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare result_id uuid;
begin
  if transaction_type not in ('credit','debit') then raise exception 'Invalid entry type'; end if;
  if transaction_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if not exists(select 1 from public.cash_books where id=target_book_id and owner_id=auth.uid()) then
    raise exception 'You can add entries only to your own Finance books';
  end if;

  insert into public.cash_transactions(book_id,entry_type,amount,description,transaction_date,notes)
  values(target_book_id,transaction_type,transaction_amount,trim(transaction_description),transaction_day,nullif(trim(transaction_notes),''))
  returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.record_finance_withdrawal(
  target_book_id uuid,
  withdrawal_amount numeric,
  withdrawal_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_book public.cash_books%rowtype;
  available_balance numeric;
  transaction_id uuid;
  withdrawal_id uuid;
begin
  select * into selected_book from public.cash_books
  where id=target_book_id and owner_id=auth.uid();
  if selected_book.id is null then raise exception 'Finance book not found'; end if;
  if withdrawal_amount <= 0 then raise exception 'Withdrawal amount must be greater than zero'; end if;

  select coalesce(sum(case when entry_type='credit' then amount else -amount end),0)
  into available_balance from public.cash_transactions where book_id=target_book_id;
  if withdrawal_amount > available_balance then raise exception 'Withdrawal exceeds the available book balance'; end if;

  insert into public.cash_transactions(book_id,entry_type,amount,description,transaction_date,notes)
  values(target_book_id,'debit',withdrawal_amount,'Withdrawal',current_date,nullif(trim(withdrawal_notes),''))
  returning id into transaction_id;

  insert into public.withdrawals(user_id,book_id,transaction_id,amount,currency,notes)
  values(auth.uid(),target_book_id,transaction_id,withdrawal_amount,selected_book.currency,nullif(trim(withdrawal_notes),''))
  returning id into withdrawal_id;
  return withdrawal_id;
end;
$$;

grant execute on function public.create_finance_book(text,text,text) to authenticated;
grant execute on function public.add_finance_transaction(uuid,text,numeric,text,date,text) to authenticated;
grant execute on function public.record_finance_withdrawal(uuid,numeric,text) to authenticated;
