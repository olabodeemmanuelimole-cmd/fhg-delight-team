-- Live announcements, feedback, events, notifications, and points.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) default auth.uid(),
  office_id uuid references public.offices(id), audience text not null check (audience in ('organization','leaders','office')),
  title text not null, message text not null, published_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) default auth.uid(),
  recipient_id uuid references public.profiles(id), office_id uuid references public.offices(id),
  message_type text not null check (message_type in ('feedback','suggestion')), subject text not null, message text not null,
  status text not null default 'new' check (status in ('new','open','resolved')), created_at timestamptz not null default now()
);
create table if not exists public.team_events (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.profiles(id) default auth.uid(),
  office_id uuid references public.offices(id), name text not null, description text, location text,
  starts_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.event_completions (
  event_id uuid not null references public.team_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  completed_at timestamptz not null default now(), primary key (event_id,user_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, message text not null, kind text not null default 'general', read_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.points_rules (
  action text primary key, points integer not null check (points >= 0), naira_per_point numeric(10,2) not null default 1,
  active boolean not null default true, updated_at timestamptz not null default now()
);
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null references public.points_rules(action), points integer not null,
  source_table text, source_id uuid, created_at timestamptz not null default now(), unique(user_id,action,source_table,source_id)
);
insert into public.points_rules(action,points,naira_per_point) values
 ('attendance_checkin',20,1),('order_logged',50,1),('weekly_plan_submitted',30,1),('event_completed',15,1)
on conflict(action) do update set points=excluded.points, naira_per_point=excluded.naira_per_point, active=true;

alter table public.announcements enable row level security; alter table public.feedback_messages enable row level security;
alter table public.team_events enable row level security; alter table public.event_completions enable row level security;
alter table public.notifications enable row level security; alter table public.points_rules enable row level security; alter table public.points_ledger enable row level security;

drop policy if exists "relevant announcements readable" on public.announcements;
create policy "relevant announcements readable" on public.announcements for select using (
  public.current_role()='admin' or audience='organization' or (audience='leaders' and public.current_role()='team_leader') or (audience='office' and office_id=public.current_office_id())
);
drop policy if exists "authorized announcement authors" on public.announcements;
create policy "authorized announcement authors" on public.announcements for insert with check (author_id=auth.uid() and public.current_role() in ('admin','team_leader'));
drop policy if exists "feedback participants read" on public.feedback_messages;
create policy "feedback participants read" on public.feedback_messages for select using (sender_id=auth.uid() or recipient_id=auth.uid() or public.current_role()='admin');
drop policy if exists "members send feedback" on public.feedback_messages;
create policy "members send feedback" on public.feedback_messages for insert with check (sender_id=auth.uid());
drop policy if exists "relevant events readable" on public.team_events;
create policy "relevant events readable" on public.team_events for select using (public.current_role()='admin' or office_id is null or office_id=public.current_office_id());
drop policy if exists "authorized event creators" on public.team_events;
create policy "authorized event creators" on public.team_events for insert with check (creator_id=auth.uid() and public.current_role() in ('admin','team_leader'));
drop policy if exists "own completion read" on public.event_completions;
create policy "own completion read" on public.event_completions for select using (user_id=auth.uid() or public.current_role()='admin');
drop policy if exists "own completion add" on public.event_completions;
create policy "own completion add" on public.event_completions for insert with check (user_id=auth.uid());
drop policy if exists "own notifications read" on public.notifications;
create policy "own notifications read" on public.notifications for select using (user_id=auth.uid() or public.current_role()='admin');
drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications for update using (user_id=auth.uid());
drop policy if exists "points rules readable" on public.points_rules;
create policy "points rules readable" on public.points_rules for select to authenticated using (active or public.current_role()='admin');
drop policy if exists "points ledger hierarchy read" on public.points_ledger;
create policy "points ledger hierarchy read" on public.points_ledger for select using (public.can_view_member(user_id));

create or replace function public.award_points_from_activity() returns trigger language plpgsql security definer set search_path=public as $$
declare action_name text; award integer; activity_user uuid; activity_id uuid;
begin
  if tg_table_name='orders' then action_name:='order_logged'; activity_user:=new.user_id; activity_id:=new.id;
  elsif tg_table_name='weekly_plans' then action_name:='weekly_plan_submitted'; activity_user:=new.user_id; activity_id:=new.id;
  elsif tg_table_name='attendance' and new.status in ('present','late') then action_name:='attendance_checkin'; activity_user:=new.user_id; activity_id:=new.id;
  else return new; end if;
  select points into award from public.points_rules where action=action_name and active;
  if award is not null then insert into public.points_ledger(user_id,action,points,source_table,source_id)
    values(activity_user,action_name,award,tg_table_name,activity_id) on conflict do nothing; end if;
  return new;
end; $$;
drop trigger if exists award_order_points on public.orders; create trigger award_order_points after insert on public.orders for each row execute function public.award_points_from_activity();
drop trigger if exists award_plan_points on public.weekly_plans; create trigger award_plan_points after insert on public.weekly_plans for each row execute function public.award_points_from_activity();
drop trigger if exists award_attendance_points on public.attendance; create trigger award_attendance_points after insert on public.attendance for each row execute function public.award_points_from_activity();

create or replace function public.publish_announcement(announcement_title text, announcement_message text)
returns uuid language plpgsql security definer set search_path=public as $$ declare result_id uuid; scope text; office uuid;
begin if public.current_role()='admin' then scope:='organization'; else scope:='office'; office:=public.current_office_id(); end if;
if public.current_role() not in ('admin','team_leader') then raise exception 'Leader access required'; end if;
insert into public.announcements(author_id,office_id,audience,title,message) values(auth.uid(),office,scope,announcement_title,announcement_message) returning id into result_id; return result_id; end; $$;
create or replace function public.submit_feedback(feedback_type text, feedback_subject text, feedback_message text, send_to_admin boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$ declare result_id uuid; recipient uuid; office uuid;
begin office:=public.current_office_id(); if send_to_admin then select id into recipient from public.profiles where role='admin' limit 1;
else select leader_id into recipient from public.offices where id=office; end if;
insert into public.feedback_messages(sender_id,recipient_id,office_id,message_type,subject,message) values(auth.uid(),recipient,office,feedback_type,feedback_subject,feedback_message) returning id into result_id; return result_id; end; $$;
create or replace function public.create_team_event(event_name text,event_description text,event_location text,event_starts_at timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$ declare result_id uuid; office uuid;
begin if public.current_role() not in ('admin','team_leader') then raise exception 'Leader access required'; end if; if public.current_role()='team_leader' then office:=public.current_office_id(); end if;
insert into public.team_events(creator_id,office_id,name,description,location,starts_at) values(auth.uid(),office,event_name,event_description,event_location,event_starts_at) returning id into result_id; return result_id; end; $$;

grant execute on function public.publish_announcement(text,text) to authenticated;
grant execute on function public.submit_feedback(text,text,text,boolean) to authenticated;
grant execute on function public.create_team_event(text,text,text,timestamptz) to authenticated;

