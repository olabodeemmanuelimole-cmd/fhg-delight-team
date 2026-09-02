-- Supporting actions for team attendance and administrator-created reward rules.

create or replace function public.leader_record_attendance(
  target_user_id uuid,
  attendance_status text,
  attendance_note text default null,
  absence_category text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare leader_office uuid; result_id uuid;
begin
  select id into leader_office from public.offices where leader_id=auth.uid() and active limit 1;
  if leader_office is null then raise exception 'An active team-leader office is required'; end if;
  if attendance_status not in ('present','late','absent') then raise exception 'Invalid attendance status'; end if;
  if not exists(select 1 from public.office_memberships where user_id=target_user_id and office_id=leader_office and ended_at is null) then
    raise exception 'This member is not assigned to your office';
  end if;
  if attendance_status='absent' and (nullif(trim(coalesce(absence_category,'')),'') is null or nullif(trim(coalesce(attendance_note,'')),'') is null) then
    raise exception 'An absence category and explanation are required';
  end if;

  insert into public.attendance(user_id,office_id,status,excuse_category,comment,checked_in_at,excuse_status,reviewed_by,reviewed_at)
  values(target_user_id,leader_office,attendance_status,
    case when attendance_status='absent' then nullif(trim(absence_category),'') end,
    nullif(trim(coalesce(attendance_note,'')),''),
    case when attendance_status in ('present','late') then now() end,
    case when attendance_status='absent' then 'approved' end,
    auth.uid(),now())
  on conflict(user_id,attendance_date) do update set
    office_id=excluded.office_id,status=excluded.status,excuse_category=excluded.excuse_category,
    comment=excluded.comment,checked_in_at=excluded.checked_in_at,excuse_status=excluded.excuse_status,
    reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now()
  returning id into result_id;
  return result_id;
end; $$;

create or replace function public.admin_create_points_rule(target_action text, rule_points integer)
returns void language plpgsql security definer set search_path=public as $$
declare current_rate numeric;
begin
  if public.current_role()<>'admin' then raise exception 'Administrator access required'; end if;
  if nullif(trim(target_action),'') is null then raise exception 'Action code is required'; end if;
  if rule_points<0 then raise exception 'Points cannot be negative'; end if;
  select coalesce(naira_per_point,1) into current_rate from public.points_rules limit 1;
  insert into public.points_rules(action,points,naira_per_point,active)
  values(trim(target_action),rule_points,coalesce(current_rate,1),true)
  on conflict(action) do update set points=excluded.points,active=true,updated_at=now();
  insert into public.audit_log(actor_id,action,entity_type,details)
  values(auth.uid(),'points_rule_created','points_rule',jsonb_build_object('rule',trim(target_action),'points',rule_points));
end; $$;

grant execute on function public.leader_record_attendance(uuid,text,text,text) to authenticated;
grant execute on function public.admin_create_points_rule(text,integer) to authenticated;
