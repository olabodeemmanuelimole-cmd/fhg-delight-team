-- Administrator controls for TeamFlow points and displayed Naira conversion.
-- Run after engagement-modules.sql.

create or replace function public.admin_update_points_rule(
  target_action text,
  new_points integer default null,
  new_active boolean default null,
  new_naira_per_point numeric default null
) returns void language plpgsql security definer set search_path=public as $$
begin
  if public.current_role()<>'admin' then raise exception 'Administrator access required'; end if;
  if new_points is not null and new_points<0 then raise exception 'Points cannot be negative'; end if;
  if new_naira_per_point is not null and new_naira_per_point<0 then raise exception 'Conversion rate cannot be negative'; end if;
  update public.points_rules
  set points=coalesce(new_points,points), active=coalesce(new_active,active), updated_at=now()
  where action=target_action;
  if not found then raise exception 'Points rule not found'; end if;
  -- TeamFlow uses one consistent conversion rate for every earning action.
  if new_naira_per_point is not null then
    update public.points_rules set naira_per_point=new_naira_per_point,updated_at=now();
  end if;
  insert into public.audit_log(actor_id,action,entity_type,details)
  values(auth.uid(),'points_rule_updated','points_rule',jsonb_build_object('rule',target_action,'points',new_points,'active',new_active,'naira_per_point',new_naira_per_point));
end; $$;

grant execute on function public.admin_update_points_rule(text,integer,boolean,numeric) to authenticated;
