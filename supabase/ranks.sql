create table if not exists public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null unique check (sort_order > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ranks (name, sort_order)
values
  ('Newbie', 1),
  ('E-member', 2),
  ('Distributor', 3),
  ('Manager', 4),
  ('Senior Manager', 5),
  ('Executive Manager', 6),
  ('Qualified Director', 7),
  ('Qualified Executive Director', 8),
  ('Qualified Sapphire Director', 9),
  ('Qualified 1 Ruby Director', 10),
  ('Qualified 2 Ruby Director', 11),
  ('Qualified 3 Ruby Director', 12),
  ('Qualified 4 Ruby Director', 13),
  ('Qualified 5 Ruby Director', 14),
  ('Qualified 1 Diamond Director', 15),
  ('Qualified 2 Diamond Director', 16),
  ('Qualified 3 Diamond Director', 17),
  ('Qualified 4 Diamond Director', 18),
  ('Qualified 5 Diamond Director', 19)
on conflict (name) do update set sort_order = excluded.sort_order;

alter table public.ranks enable row level security;

create policy "authenticated users read active ranks" on public.ranks for select
to authenticated using (active or public.current_role() = 'admin');

create policy "admins create ranks" on public.ranks for insert
to authenticated with check (public.current_role() = 'admin');

create policy "admins update ranks" on public.ranks for update
to authenticated using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy "admins delete ranks" on public.ranks for delete
to authenticated using (public.current_role() = 'admin');

create or replace function public.complete_registration(
  selected_office_id uuid,
  selected_sponsor_id uuid default null,
  selected_rank text default 'Newbie',
  member_phone text default null,
  member_bio text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.offices where id = selected_office_id and active) then
    raise exception 'Selected office is unavailable';
  end if;
  if not exists (select 1 from public.ranks where name = selected_rank and active) then
    raise exception 'Selected rank is unavailable';
  end if;
  if selected_sponsor_id = auth.uid() then raise exception 'A member cannot sponsor themselves'; end if;

  update public.profiles
  set sponsor_id = selected_sponsor_id,
      rank = selected_rank,
      phone = nullif(member_phone, ''),
      updated_at = now()
  where id = auth.uid();

  insert into public.office_memberships (user_id, office_id)
  values (auth.uid(), selected_office_id)
  on conflict (user_id, ended_at) do update set office_id = excluded.office_id;
end;
$$;

grant execute on function public.complete_registration(uuid, uuid, text, text, text) to authenticated;
