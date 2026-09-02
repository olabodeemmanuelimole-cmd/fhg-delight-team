-- Allow an administrator to promote a registered person and assign their office.

create or replace function public.admin_assign_team_leader(target_user_id uuid, target_office_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare member_name text; existing_leader uuid;
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;

  select full_name into member_name from public.profiles where id = target_user_id;
  if member_name is null then raise exception 'Member profile not found'; end if;

  select leader_id into existing_leader from public.offices where id = target_office_id and active;
  if not found then raise exception 'Active office not found'; end if;
  if existing_leader is not null and existing_leader <> target_user_id then
    raise exception 'This office already has a linked team leader';
  end if;

  update public.profiles
  set role = case when role = 'admin' then 'admin'::public.app_role else 'team_leader'::public.app_role end,
      status = 'active', updated_at = now()
  where id = target_user_id;

  insert into public.office_memberships (user_id, office_id, approved_by)
  values (target_user_id, target_office_id, auth.uid())
  on conflict (user_id, ended_at) do update
  set office_id = excluded.office_id, approved_by = excluded.approved_by;

  update public.offices
  set leader_id = target_user_id, leader_display_name = member_name
  where id = target_office_id;
end; $$;

grant execute on function public.admin_assign_team_leader(uuid,uuid) to authenticated;

