-- Two-level team-leader permissions.
-- Run once in Supabase SQL Editor before deploying the matching app update.

alter table public.profiles
  add column if not exists leader_access_level text not null default 'limited';

alter table public.profiles drop constraint if exists profiles_leader_access_level_check;
alter table public.profiles add constraint profiles_leader_access_level_check
  check (leader_access_level in ('limited','full'));

alter table public.team_leader_invitations
  add column if not exists access_level text not null default 'limited';

alter table public.team_leader_invitations drop constraint if exists team_leader_invitations_access_level_check;
alter table public.team_leader_invitations add constraint team_leader_invitations_access_level_check
  check (access_level in ('limited','full'));

update public.profiles set leader_access_level='full' where role='admin';

create or replace function public.has_full_leader_access()
returns boolean language sql stable security definer set search_path=public as $$
  select public.current_role()='admin' or exists (
    select 1 from public.profiles
    where id=auth.uid() and role='team_leader' and leader_access_level='full'
  );
$$;

create or replace function public.admin_assign_team_leader_with_access(
  target_user_id uuid,
  target_office_id uuid,
  requested_access_level text default 'limited'
) returns void language plpgsql security definer set search_path=public as $$
declare member_name text; existing_leader uuid;
begin
  if public.current_role()<>'admin' then raise exception 'Administrator access required'; end if;
  if requested_access_level not in ('limited','full') then raise exception 'Choose limited or full access'; end if;
  select full_name into member_name from public.profiles where id=target_user_id;
  if member_name is null then raise exception 'Member profile not found'; end if;
  select leader_id into existing_leader from public.offices where id=target_office_id and active;
  if not found then raise exception 'Active office not found'; end if;
  if existing_leader is not null and existing_leader<>target_user_id then raise exception 'This office already has a linked team leader'; end if;

  update public.profiles set
    role=case when role='admin' then 'admin'::public.app_role else 'team_leader'::public.app_role end,
    status='active', leader_access_level=case when role='admin' then 'full' else requested_access_level end,
    updated_at=now()
  where id=target_user_id;
  insert into public.office_memberships(user_id,office_id,approved_by)
  values(target_user_id,target_office_id,auth.uid())
  on conflict(user_id,ended_at) do update set office_id=excluded.office_id,approved_by=excluded.approved_by;
  update public.offices set leader_id=target_user_id,leader_display_name=member_name where id=target_office_id;
  perform public.write_audit('team_leader_assigned','profile',target_user_id::text,jsonb_build_object('office_id',target_office_id,'access_level',requested_access_level));
end; $$;

create or replace function public.admin_set_team_leader_access(target_user_id uuid,new_access_level text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.current_role()<>'admin' then raise exception 'Administrator access required'; end if;
  if new_access_level not in ('limited','full') then raise exception 'Choose limited or full access'; end if;
  update public.profiles set leader_access_level=new_access_level,updated_at=now()
  where id=target_user_id and role='team_leader';
  if not found then raise exception 'Team leader not found'; end if;
  perform public.write_audit('team_leader_access_changed','profile',target_user_id::text,jsonb_build_object('access_level',new_access_level));
  insert into public.notifications(user_id,title,message,destination)
  values(target_user_id,'Team-leader access updated',format('Your team-leader access is now %s.',new_access_level),'leaderdashboard');
end; $$;

-- Leaders who join by invitation begin safely with limited access. The overall
-- administrator can promote them to full access from the Leaders directory.
create or replace function public.admin_approve_team_leader_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare invitation public.team_leader_invitations%rowtype; member_name text;
begin
  if public.current_role()<>'admin' then raise exception 'Administrator access required'; end if;
  select * into invitation from public.team_leader_invitations where id=invitation_id for update;
  if not found or invitation.status<>'claimed' or invitation.claimed_by is null then raise exception 'This invitation is not ready for approval'; end if;
  if exists(select 1 from public.offices where id=invitation.office_id and leader_id is not null and leader_id<>invitation.claimed_by) then raise exception 'This office already has a different team leader'; end if;
  select full_name into member_name from public.profiles where id=invitation.claimed_by;
  update public.profiles set role='team_leader',status='active',leader_access_level=invitation.access_level,updated_at=now() where id=invitation.claimed_by and role<>'admin';
  update public.profiles set status='active',leader_access_level='full',updated_at=now() where id=invitation.claimed_by and role='admin';
  update public.office_memberships set approved_by=auth.uid() where user_id=invitation.claimed_by and office_id=invitation.office_id and ended_at is null;
  update public.offices set leader_id=invitation.claimed_by,leader_display_name=member_name where id=invitation.office_id;
  update public.team_leader_invitations set status='approved',decided_at=now(),decided_by=auth.uid() where id=invitation.id;
end; $$;

grant execute on function public.has_full_leader_access() to authenticated;
grant execute on function public.admin_assign_team_leader_with_access(uuid,uuid,text) to authenticated;
grant execute on function public.admin_set_team_leader_access(uuid,text) to authenticated;
grant execute on function public.admin_approve_team_leader_invitation(uuid) to authenticated;
