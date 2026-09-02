-- Attendance excuse review workflow.
-- Run this file once in the Supabase SQL Editor.

create or replace function public.review_attendance_excuse(
  attendance_id uuid,
  decision text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  attendance_record public.attendance%rowtype;
begin
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select * into attendance_record
  from public.attendance
  where id = attendance_id;

  if attendance_record.id is null then
    raise exception 'Attendance record not found';
  end if;

  if attendance_record.status <> 'absent' or attendance_record.excuse_status <> 'pending' then
    raise exception 'Only pending absence excuses can be reviewed';
  end if;

  if public.current_role() <> 'admin' and not (
    public.current_role() = 'team_leader'
    and attendance_record.office_id = public.current_office_id()
  ) then
    raise exception 'You cannot review attendance for this office';
  end if;

  update public.attendance
  set excuse_status = decision,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = attendance_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    'attendance_excuse_' || decision,
    'attendance',
    attendance_id::text,
    jsonb_build_object('member_id', attendance_record.user_id, 'office_id', attendance_record.office_id)
  );
end;
$$;

grant execute on function public.review_attendance_excuse(uuid, text) to authenticated;
