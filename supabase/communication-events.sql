-- Complete communication and event workflows.
-- Run this after engagement-modules.sql.

alter table public.notifications add column if not exists related_type text;
alter table public.notifications add column if not exists related_id uuid;

alter table public.announcements drop constraint if exists announcements_audience_check;
alter table public.announcements add constraint announcements_audience_check
  check (audience in ('organization','leaders','office','individual'));

create table if not exists public.announcement_recipients (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (announcement_id,user_id)
);
alter table public.announcement_recipients enable row level security;

drop policy if exists "own announcement recipients readable" on public.announcement_recipients;
create policy "own announcement recipients readable" on public.announcement_recipients for select
using (user_id=auth.uid() or public.current_role()='admin');

drop policy if exists "relevant announcements readable" on public.announcements;
create policy "relevant announcements readable" on public.announcements for select using (
  public.current_role()='admin' or audience='organization'
  or (audience='leaders' and public.current_role()='team_leader')
  or (audience='office' and office_id=public.current_office_id())
  or (audience='individual' and exists (
    select 1 from public.announcement_recipients ar
    where ar.announcement_id=id and ar.user_id=auth.uid()
  ))
);

drop policy if exists "feedback recipients update" on public.feedback_messages;
create policy "feedback recipients update" on public.feedback_messages for update using (
  recipient_id=auth.uid() or public.current_role()='admin'
) with check (recipient_id=auth.uid() or public.current_role()='admin');

create or replace function public.publish_targeted_announcement(
  announcement_title text,
  announcement_message text,
  target_audience text,
  target_office_id uuid default null,
  target_user_id uuid default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare result_id uuid; author_role text; author_office uuid;
begin
  author_role:=public.current_role(); author_office:=public.current_office_id();
  if author_role not in ('admin','team_leader') then raise exception 'Leader access required'; end if;
  if target_audience not in ('organization','leaders','office','individual') then raise exception 'Invalid audience'; end if;
  if author_role='team_leader' then
    if target_audience <> 'office' then raise exception 'Team leaders can publish to their own office only'; end if;
    target_office_id:=author_office;
  end if;
  if target_audience='office' and target_office_id is null then target_office_id:=author_office; end if;
  if target_audience='office' and target_office_id is null then raise exception 'Choose an office'; end if;
  if target_audience='individual' and target_user_id is null then raise exception 'Choose a recipient'; end if;

  insert into public.announcements(author_id,office_id,audience,title,message)
  values(auth.uid(),case when target_audience='office' then target_office_id else null end,target_audience,announcement_title,announcement_message)
  returning id into result_id;
  if target_audience='individual' then
    insert into public.announcement_recipients(announcement_id,user_id) values(result_id,target_user_id);
  end if;

  insert into public.notifications(user_id,title,message,kind,related_type,related_id)
  select distinct p.id,announcement_title,announcement_message,'announcement','announcements',result_id
  from public.profiles p
  left join public.office_memberships om on om.user_id=p.id and om.ended_at is null
  where p.id<>auth.uid() and coalesce(p.status,'active')<>'suspended' and (
    target_audience='organization'
    or (target_audience='leaders' and p.role='team_leader')
    or (target_audience='office' and om.office_id=target_office_id)
    or (target_audience='individual' and p.id=target_user_id)
  );
  return result_id;
end; $$;

create or replace function public.create_targeted_event(
  event_name text,event_description text,event_location text,event_starts_at timestamptz,
  target_audience text default 'office',target_office_id uuid default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare result_id uuid; author_role text; author_office uuid; event_office uuid;
begin
  author_role:=public.current_role(); author_office:=public.current_office_id();
  if author_role not in ('admin','team_leader') then raise exception 'Leader access required'; end if;
  if event_starts_at is null then raise exception 'Choose an event date and time'; end if;
  if author_role='team_leader' then target_audience:='office'; target_office_id:=author_office; end if;
  if target_audience not in ('organization','office') then raise exception 'Invalid event audience'; end if;
  if target_audience='office' and target_office_id is null then target_office_id:=author_office; end if;
  if target_audience='office' and target_office_id is null then raise exception 'Choose an office'; end if;
  event_office:=case when target_audience='office' then target_office_id else null end;
  insert into public.team_events(creator_id,office_id,name,description,location,starts_at)
  values(auth.uid(),event_office,event_name,event_description,event_location,event_starts_at) returning id into result_id;
  insert into public.notifications(user_id,title,message,kind,related_type,related_id)
  select distinct p.id,event_name,coalesce(event_description,'A new team event has been scheduled.'),'event','events',result_id
  from public.profiles p left join public.office_memberships om on om.user_id=p.id and om.ended_at is null
  where p.id<>auth.uid() and coalesce(p.status,'active')<>'suspended'
    and (event_office is null or om.office_id=event_office);
  return result_id;
end; $$;

create or replace function public.complete_team_event(target_event_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare event_office uuid; award integer;
begin
  select office_id into event_office from public.team_events where id=target_event_id;
  if not found then raise exception 'Event not found'; end if;
  if public.current_role()<>'admin' and event_office is not null and event_office<>public.current_office_id() then raise exception 'Event is not available to you'; end if;
  insert into public.event_completions(event_id,user_id) values(target_event_id,auth.uid()) on conflict do nothing;
  select points into award from public.points_rules where action='event_completed' and active;
  if award is not null then
    insert into public.points_ledger(user_id,action,points,source_table,source_id)
    values(auth.uid(),'event_completed',award,'event_completions',target_event_id) on conflict do nothing;
  end if;
end; $$;

create or replace function public.update_feedback_status(target_message_id uuid,new_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if new_status not in ('new','open','resolved') then raise exception 'Invalid feedback status'; end if;
  update public.feedback_messages set status=new_status where id=target_message_id
    and (recipient_id=auth.uid() or public.current_role()='admin');
  if not found then raise exception 'Message not found or access denied'; end if;
end; $$;

grant execute on function public.publish_targeted_announcement(text,text,text,uuid,uuid) to authenticated;
grant execute on function public.create_targeted_event(text,text,text,timestamptz,text,uuid) to authenticated;
grant execute on function public.complete_team_event(uuid) to authenticated;
grant execute on function public.update_feedback_status(uuid,text) to authenticated;
