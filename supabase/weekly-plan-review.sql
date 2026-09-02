-- Weekly plan leader review workflow.
-- Run this file once in the Supabase SQL Editor.

create or replace function public.review_weekly_plan(
  plan_id uuid,
  completion_score integer,
  rating text,
  leader_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_record public.weekly_plans%rowtype;
  member_office uuid;
begin
  if completion_score < 0 or completion_score > 100 then
    raise exception 'Completion score must be between 0 and 100';
  end if;

  if rating not in ('good', 'poor') then
    raise exception 'Rating must be good or poor';
  end if;

  select * into plan_record
  from public.weekly_plans
  where id = plan_id;

  if plan_record.id is null then
    raise exception 'Weekly plan not found';
  end if;

  select office_id into member_office
  from public.office_memberships
  where user_id = plan_record.user_id and ended_at is null
  limit 1;

  if public.current_role() <> 'admin' and not (
    public.current_role() = 'team_leader'
    and member_office = public.current_office_id()
  ) then
    raise exception 'You cannot review plans for this office';
  end if;

  if plan_record.reviewed_at is not null then
    raise exception 'This weekly plan has already been reviewed';
  end if;

  update public.weekly_plans
  set completion_percent = completion_score,
      review_rating = rating,
      review_note = nullif(leader_note, ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = plan_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    'weekly_plan_reviewed',
    'weekly_plan',
    plan_id::text,
    jsonb_build_object(
      'member_id', plan_record.user_id,
      'office_id', member_office,
      'completion_score', completion_score,
      'rating', rating
    )
  );
end;
$$;

grant execute on function public.review_weekly_plan(uuid, integer, text, text) to authenticated;
