create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  director_name text not null,
  director_title text not null,
  welcome_message text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.organizations (name, director_name, director_title, welcome_message)
values (
  'FHG Delight Team',
  'Olabode Emmanuel Imole',
  'Sapphire Director',
  'Welcome to the team. We are delighted to have you join a community built on consistency, honest growth and people supporting one another. Your office, team leader and sponsor are here to help you make meaningful progress.'
)
on conflict (name) do update
set director_name = excluded.director_name,
    director_title = excluded.director_title,
    welcome_message = excluded.welcome_message,
    active = true,
    updated_at = now();

alter table public.organizations enable row level security;
drop policy if exists "authenticated users read organizations" on public.organizations;
create policy "authenticated users read organizations" on public.organizations for select
to authenticated using (active or public.current_role() = 'admin');

alter table public.offices
add column if not exists leader_display_name text;

alter table public.offices
add column if not exists organization_id uuid references public.organizations(id) on delete restrict;

update public.offices set active = false;

insert into public.offices (name, location, leader_display_name, organization_id, active)
values
  ('Delight Team Office', 'Ede, Osun State', 'Mr Adediran Mojeed', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Delight Team Office — Gbongan', 'Gbongan, Osun State', 'Mr Emmanuel Olabode', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Prudent Team Office', 'Kotopo, Abeokuta, Ogun State', 'Mr Akinnusi Gabriel', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('De Mighty Team Office', 'Iseyin, Oyo State', 'Mr Adegbite Iyanuoluwa', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Elite Office', 'Iyana Agbala, Ajia Road, Ibadan, Oyo State', 'Emmanuel Adekunle', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Impeccable Team Office', 'Ede, Osun State', 'Awhanse Samuel', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Dream Builders Team Office', 'Ede, Osun State', 'Mr Hammed Raheem', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Prosperity Partners Team', 'Ede, Osun State', 'Afolayan Posi', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Prosperous Team', 'Ibadan, Oyo State', 'Adekunle Anjola', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Everlead Team', 'Ofatedo, Osun State', 'Olumide Akindele', (select id from public.organizations where name = 'FHG Delight Team'), true),
  ('Apex Team', 'Iseyin, Oyo State', 'Peter Onomeh', (select id from public.organizations where name = 'FHG Delight Team'), true)
on conflict (name) do update
set location = excluded.location,
    leader_display_name = excluded.leader_display_name,
    organization_id = excluded.organization_id,
    active = true;

create or replace function public.sponsors_for_office(selected_office_id uuid)
returns table (id uuid, full_name text, rank text, role public.app_role)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.rank, p.role
  from public.profiles p
  join public.office_memberships m on m.user_id = p.id
  where auth.uid() is not null
    and m.office_id = selected_office_id
    and m.ended_at is null
    and p.id <> auth.uid()
    and p.status = 'active'
  order by
    case when p.role = 'team_leader' then 0 else 1 end,
    p.full_name;
$$;

grant execute on function public.sponsors_for_office(uuid) to authenticated;

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
  if selected_sponsor_id is not null and not exists (
    select 1
    from public.profiles p
    join public.office_memberships m on m.user_id = p.id
    where p.id = selected_sponsor_id
      and p.status = 'active'
      and m.office_id = selected_office_id
      and m.ended_at is null
  ) then raise exception 'Selected sponsor is not eligible for this office';
  end if;

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
