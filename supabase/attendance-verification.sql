-- Run this complete migration in Supabase SQL Editor before deploying the app.
begin;
alter table public.attendance add column if not exists arrival_status text;
alter table public.attendance add column if not exists signed_out_at timestamptz;
alter table public.attendance add column if not exists verified_by uuid references public.profiles(id) on delete set null;
alter table public.attendance add column if not exists verified_at timestamptz;
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance add constraint attendance_status_check check(status in ('present','late','absent','pending'));
-- Historical records retain their existing reporting classification.
update public.attendance set arrival_status=status where arrival_status is null and status in ('present','late');
create table if not exists public.attendance_checkout_codes (
 attendance_id uuid primary key references public.attendance(id) on delete cascade,
 code text not null
);
alter table public.attendance_checkout_codes enable row level security;
revoke all on public.attendance_checkout_codes from anon, authenticated;
revoke insert, update, delete on public.attendance from anon, authenticated;

create or replace function public.submit_attendance(attendance_status text, attendance_note text default null, absence_category text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare result_id uuid; office uuid; existing public.attendance; day date := (now() at time zone 'Africa/Lagos')::date;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and status='active') then raise exception 'An active approved account is required'; end if;
 office := public.current_office_id();
 if office is null then raise exception 'An active office assignment is required'; end if;
 if attendance_status is null or attendance_status not in ('present','late','absent') then raise exception 'Invalid attendance status'; end if;
 if attendance_status='absent' and (nullif(trim(absence_category),'') is null or nullif(trim(attendance_note),'') is null) then raise exception 'An absence category and explanation are required'; end if;
 -- Serializes repeat/concurrent submissions by this member.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into existing from public.attendance where user_id=auth.uid() and attendance_date=day for update;
 if existing.id is not null then
   if existing.status <> 'absent' or existing.excuse_status <> 'pending' then return existing.id; end if;
   if attendance_status='absent' then return existing.id; end if;
 end if;
 insert into public.attendance(user_id,office_id,attendance_date,status,arrival_status,checked_in_at,comment,excuse_category,excuse_status)
 values(auth.uid(),office,day,case when attendance_status='absent' then 'absent' else 'pending' end,
 case when attendance_status<>'absent' then attendance_status end,case when attendance_status<>'absent' then now() end,
 nullif(trim(attendance_note),''),case when attendance_status='absent' then absence_category end,case when attendance_status='absent' then 'pending' end)
 on conflict(user_id,attendance_date) do update set status=excluded.status,arrival_status=excluded.arrival_status,checked_in_at=excluded.checked_in_at,comment=excluded.comment,excuse_category=excluded.excuse_category,excuse_status=excluded.excuse_status,updated_at=now()
 returning id into result_id;
 if attendance_status<>'absent' then
 insert into public.attendance_checkout_codes values(result_id,upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))) on conflict(attendance_id) do nothing;
 end if;
 return result_id;
end; $$;

create or replace function public.my_attendance_today()
returns table(id uuid,status text,checked_in_at timestamptz,signed_out_at timestamptz,code text)
language sql stable security definer set search_path=public as $$
 select a.id,a.status,a.checked_in_at,a.signed_out_at,case when a.signed_out_at is null then c.code end
 from public.attendance a left join public.attendance_checkout_codes c on c.attendance_id=a.id
 where a.user_id=auth.uid() and a.attendance_date=(now() at time zone 'Africa/Lagos')::date;
$$;

create or replace function public.verify_attendance(attendance_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare record public.attendance;
begin
 select * into record from public.attendance where id=attendance_id for update;
 if auth.uid() is null or not coalesce(public.has_full_leader_access(),false) or not exists(select 1 from public.profiles where id=auth.uid() and status='active') then raise exception 'Active full team-leader access is required'; end if;
 if record.id is null then raise exception 'Attendance record not found'; end if;
 if public.current_role()<>'admin' and not exists(select 1 from public.offices where id=record.office_id and leader_id=auth.uid() and active) then raise exception 'You can approve only your own office'; end if;
 if record.user_id=auth.uid() then raise exception 'Another authorized leader must verify your attendance'; end if;
 if not exists(select 1 from public.office_memberships where user_id=record.user_id and office_id=record.office_id and ended_at is null) then raise exception 'This member is no longer assigned to this office'; end if;
 if record.status<>'pending' or record.attendance_date<>(now() at time zone 'Africa/Lagos')::date then raise exception 'Only today’s pending check-ins can be verified'; end if;
 update public.attendance set status=coalesce(arrival_status,'present'),verified_by=auth.uid(),verified_at=now(),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=attendance_id;
end; $$;

create or replace function public.sign_out_attendance(attendance_id uuid, daily_code text)
returns void language plpgsql security definer set search_path=public as $$
declare record public.attendance;
begin
 select * into record from public.attendance where id=attendance_id and user_id=auth.uid() for update;
 if record.id is null or record.attendance_date<>(now() at time zone 'Africa/Lagos')::date then raise exception 'A check-in for today is required'; end if;
 if record.signed_out_at is not null then raise exception 'You have already signed out'; end if;
 if record.status not in ('present','late') then raise exception 'Your leader must verify your check-in before sign-out'; end if;
 if not exists(select 1 from public.attendance_checkout_codes where attendance_checkout_codes.attendance_id=record.id and code=upper(trim(daily_code))) then raise exception 'The daily sign-out code is incorrect'; end if;
 update public.attendance set signed_out_at=now(),updated_at=now() where id=record.id;
 delete from public.attendance_checkout_codes where attendance_checkout_codes.attendance_id=record.id;
end; $$;

create or replace function public.office_attendance_today(target_office_id uuid)
returns table(member_id uuid,full_name text,attendance_id uuid,status text,signed_out_at timestamptz)
language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null or not coalesce(public.has_full_leader_access(),false) or not exists(select 1 from public.profiles viewer where viewer.id=auth.uid() and viewer.status='active') then raise exception 'Active full team-leader access is required'; end if;
 if public.current_role()<>'admin' and not exists(select 1 from public.offices o where o.id=target_office_id and o.leader_id=auth.uid() and o.active) then raise exception 'This office is outside your access'; end if;
 return query select p.id,p.full_name,a.id,coalesce(a.status,'not_checked_in'),a.signed_out_at
 from public.office_memberships m join public.profiles p on p.id=m.user_id
 left join public.attendance a on a.user_id=p.id and a.office_id=m.office_id and a.attendance_date=(now() at time zone 'Africa/Lagos')::date
 where m.office_id=target_office_id and m.ended_at is null and p.status='active' order by p.full_name;
end; $$;

-- Prevent the old manual marking button bypassing physical verification.
create or replace function public.leader_record_attendance(target_user_id uuid, attendance_status text, attendance_note text default null, absence_category text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare record_id uuid;
begin
 if attendance_status not in ('present','late') then raise exception 'Members should submit absence reports from their portal'; end if;
 select id into record_id from public.attendance where user_id=target_user_id and attendance_date=(now() at time zone 'Africa/Lagos')::date and status='pending';
 if record_id is null then raise exception 'The member must check in first'; end if;
 perform public.verify_attendance(record_id);
 return record_id;
end; $$;
revoke all on function public.submit_attendance(text,text,text),public.my_attendance_today(),public.verify_attendance(uuid),public.sign_out_attendance(uuid,text),public.office_attendance_today(uuid),public.leader_record_attendance(uuid,text,text,text) from public,anon;
grant execute on function public.submit_attendance(text,text,text),public.my_attendance_today(),public.verify_attendance(uuid),public.sign_out_attendance(uuid,text),public.office_attendance_today(uuid),public.leader_record_attendance(uuid,text,text,text) to authenticated;
-- Rewards are granted on verification, not on the member's unverified claim.
drop trigger if exists award_attendance_points on public.attendance;
create trigger award_attendance_points after insert or update of status on public.attendance
for each row execute function public.award_points_from_activity();

create or replace function public.notify_attendance_verification()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='pending' and (tg_op='INSERT' or old.status is distinct from new.status) then
 insert into public.notifications(user_id,title,message,kind,related_type,related_id)
 select distinct p.id,'Check-in awaiting verification',coalesce(member.full_name,'A member') || ' has checked in. Confirm their physical presence.','member_activity','attendanceregister',new.id
 from public.profiles p cross join public.profiles member
 where member.id=new.user_id and p.status='active' and p.id<>new.user_id and
 (p.role='admin' or (p.leader_access_level='full' and exists(select 1 from public.offices o where o.id=new.office_id and o.leader_id=p.id and o.active)));
 elsif tg_op='UPDATE' and old.status='pending' and new.status in ('present','late') then
 insert into public.notifications(user_id,title,message,kind,related_type,related_id)
 values(new.user_id,'Attendance verified','Your leader verified today’s check-in. You can now use your daily code to sign out.','member_activity','attendance',new.id);
 end if;
 return new;
end; $$;
drop trigger if exists notify_attendance_verification_trigger on public.attendance;
create trigger notify_attendance_verification_trigger after insert or update of status on public.attendance
for each row execute function public.notify_attendance_verification();
commit;
