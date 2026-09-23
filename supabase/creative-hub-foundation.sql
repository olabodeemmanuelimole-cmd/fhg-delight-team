-- TIO project briefs. No AI providers or external transmission configured.
begin;
create table if not exists public.creative_projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 200),
 tool_id text not null check (tool_id in ('positioning','titles','copy','pricing','bio','visuals','portfolio','experience','illustration')),
 brief jsonb not null default '{}' check (jsonb_typeof(brief)='object' and octet_length(brief::text)<=400000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists creative_projects_owner on public.creative_projects(owner_id, updated_at desc);
create or replace function public.creative_stamp_update() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end; $$;
drop trigger if exists creative_projects_stamp on public.creative_projects;
create trigger creative_projects_stamp before update on public.creative_projects for each row execute function public.creative_stamp_update();
create or replace function public.creative_active_member() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active');
$$;
revoke all on function public.creative_active_member() from public;
grant execute on function public.creative_active_member() to authenticated;
alter table public.creative_projects enable row level security;
revoke all on public.creative_projects from anon,authenticated;
grant select,insert,update on public.creative_projects to authenticated;
drop policy if exists creative_owner_read on public.creative_projects;
create policy creative_owner_read on public.creative_projects for select to authenticated using(owner_id=auth.uid() and public.creative_active_member());
drop policy if exists creative_owner_create on public.creative_projects;
create policy creative_owner_create on public.creative_projects for insert to authenticated with check(owner_id=auth.uid() and public.creative_active_member());
drop policy if exists creative_owner_update on public.creative_projects;
create policy creative_owner_update on public.creative_projects for update to authenticated using(owner_id=auth.uid() and public.creative_active_member()) with check(owner_id=auth.uid() and public.creative_active_member());
commit;
