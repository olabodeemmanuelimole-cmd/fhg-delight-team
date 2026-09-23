-- Learning Hub foundation for the EXISTING TeamFlow database.
-- Does not replace profiles, auth triggers, offices, or existing module tables.
-- Phase 1: admin-managed courses, lessons and personal completion records.
-- Creator delegation, restricted courses and review workflows follow separately.
begin;

create table if not exists public.learning_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  category text not null default 'General',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.learning_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.learning_courses(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  content text not null default '',
  video_url text check (video_url is null or video_url ~ '^https://'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);
create index if not exists learning_lessons_course_position on public.learning_lessons(course_id, position);

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.learning_lessons(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  resource_url text not null check (resource_url ~ '^https://')
);
create index if not exists learning_resources_lesson on public.learning_resources(lesson_id);

create table if not exists public.learning_progress (
  member_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.learning_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (member_id, lesson_id)
);

create or replace function public.learning_is_active()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active'); $$;

create or replace function public.learning_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role='admin'); $$;

revoke all on function public.learning_is_active() from public;
revoke all on function public.learning_is_admin() from public;
grant execute on function public.learning_is_active(), public.learning_is_admin() to authenticated;

alter table public.learning_courses enable row level security;
alter table public.learning_lessons enable row level security;
alter table public.learning_resources enable row level security;
alter table public.learning_progress enable row level security;
revoke all on public.learning_courses, public.learning_lessons, public.learning_resources, public.learning_progress from anon, authenticated;
grant select, insert, update, delete on public.learning_courses, public.learning_lessons, public.learning_resources to authenticated;
grant select, insert, delete on public.learning_progress to authenticated;

drop policy if exists learning_courses_read on public.learning_courses;
create policy learning_courses_read on public.learning_courses for select to authenticated
using (public.learning_is_admin() or (public.learning_is_active() and status='published'));
drop policy if exists learning_courses_create on public.learning_courses;
create policy learning_courses_create on public.learning_courses for insert to authenticated
with check (public.learning_is_admin() and created_by=auth.uid());
drop policy if exists learning_courses_update on public.learning_courses;
create policy learning_courses_update on public.learning_courses for update to authenticated
using (public.learning_is_admin()) with check (public.learning_is_admin());
drop policy if exists learning_courses_delete on public.learning_courses;
create policy learning_courses_delete on public.learning_courses for delete to authenticated
using (public.learning_is_admin());

drop policy if exists learning_lessons_read on public.learning_lessons;
create policy learning_lessons_read on public.learning_lessons for select to authenticated
using (public.learning_is_admin() or (public.learning_is_active() and exists (
  select 1 from public.learning_courses c where c.id=course_id and c.status='published'
)));
drop policy if exists learning_lessons_manage on public.learning_lessons;
create policy learning_lessons_manage on public.learning_lessons for all to authenticated
using (public.learning_is_admin()) with check (public.learning_is_admin());

drop policy if exists learning_resources_read on public.learning_resources;
create policy learning_resources_read on public.learning_resources for select to authenticated
using (public.learning_is_admin() or (public.learning_is_active() and exists (
  select 1 from public.learning_lessons l join public.learning_courses c on c.id=l.course_id
  where l.id=lesson_id and c.status='published'
)));
drop policy if exists learning_resources_manage on public.learning_resources;
create policy learning_resources_manage on public.learning_resources for all to authenticated
using (public.learning_is_admin()) with check (public.learning_is_admin());

drop policy if exists learning_progress_read on public.learning_progress;
create policy learning_progress_read on public.learning_progress for select to authenticated
using (public.learning_is_admin() or (public.learning_is_active() and member_id=auth.uid()));
drop policy if exists learning_progress_create on public.learning_progress;
create policy learning_progress_create on public.learning_progress for insert to authenticated
with check (public.learning_is_active() and member_id=auth.uid() and exists (
  select 1 from public.learning_lessons l join public.learning_courses c on c.id=l.course_id
  where l.id=lesson_id and c.status='published'
));
drop policy if exists learning_progress_remove on public.learning_progress;
create policy learning_progress_remove on public.learning_progress for delete to authenticated
using (public.learning_is_active() and member_id=auth.uid());

commit;
