create extension if not exists pgcrypto;

create type public.app_role as enum ('member', 'team_leader', 'admin');
create type public.membership_status as enum ('pending', 'active', 'suspended');
create type public.transfer_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'member',
  rank text not null default 'Newbie',
  status public.membership_status not null default 'pending',
  sponsor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text not null,
  leader_id uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.office_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  unique nulls not distinct (user_id, ended_at)
);

create table public.office_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_office_id uuid not null references public.offices(id),
  to_office_id uuid not null references public.offices(id),
  reason text not null,
  status public.transfer_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  check (from_office_id <> to_office_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_office_id()
returns uuid language sql stable security definer set search_path = public
as $$ select office_id from public.office_memberships where user_id = auth.uid() and ended_at is null limit 1 $$;

alter table public.profiles enable row level security;
alter table public.offices enable row level security;
alter table public.office_memberships enable row level security;
alter table public.office_transfers enable row level security;

create policy "profiles self admin or office leader read" on public.profiles for select
using (
  id = auth.uid()
  or public.current_role() = 'admin'
  or exists (
    select 1 from public.office_memberships m
    where m.user_id = profiles.id and m.ended_at is null
      and m.office_id = public.current_office_id()
      and public.current_role() = 'team_leader'
  )
);

create policy "profiles update self or admin" on public.profiles for update
using (id = auth.uid() or public.current_role() = 'admin')
with check (id = auth.uid() or public.current_role() = 'admin');

create policy "authenticated users read offices" on public.offices for select
to authenticated using (true);

create policy "admins manage offices" on public.offices for all
using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "memberships visible by self leader or admin" on public.office_memberships for select
using (
  user_id = auth.uid()
  or public.current_role() = 'admin'
  or (public.current_role() = 'team_leader' and office_id = public.current_office_id())
);

create policy "transfers visible by participant leaders or admin" on public.office_transfers for select
using (
  user_id = auth.uid()
  or public.current_role() = 'admin'
  or (public.current_role() = 'team_leader' and (from_office_id = public.current_office_id() or to_office_id = public.current_office_id()))
);

create policy "members request own transfer" on public.office_transfers for insert
with check (user_id = auth.uid() and status = 'pending');

create policy "requester cancels pending transfer" on public.office_transfers for update
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'cancelled');

create policy "destination leader or admin decides transfer" on public.office_transfers for update
using (public.current_role() = 'admin' or (public.current_role() = 'team_leader' and to_office_id = public.current_office_id()));
