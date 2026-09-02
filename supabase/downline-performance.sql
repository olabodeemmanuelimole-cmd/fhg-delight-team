-- Sponsor/downline visibility with safe performance summaries.
-- Run this file once in the Supabase SQL Editor.

create or replace function public.downline_performance(target_user_id uuid default null)
returns table (
  user_id uuid,
  full_name text,
  rank text,
  office_id uuid,
  office_name text,
  order_count bigint,
  active_orders bigint,
  completed_earnings numeric,
  attendance_rate numeric,
  plan_completion numeric,
  last_activity timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.rank,
    o.id,
    o.name,
    coalesce(order_stats.order_count, 0),
    coalesce(order_stats.active_orders, 0),
    coalesce(order_stats.completed_earnings, 0),
    coalesce(attendance_stats.attendance_rate, 0),
    coalesce(plan_stats.plan_completion, 0),
    greatest(order_stats.last_order, attendance_stats.last_attendance, plan_stats.last_plan)
  from public.profiles p
  left join public.office_memberships membership
    on membership.user_id = p.id and membership.ended_at is null
  left join public.offices o on o.id = membership.office_id
  left join lateral (
    select
      count(*)::bigint as order_count,
      count(*) filter (where status = 'active')::bigint as active_orders,
      coalesce(sum(amount) filter (where status = 'completed'), 0)::numeric as completed_earnings,
      max(updated_at) as last_order
    from public.orders where user_id = p.id
  ) order_stats on true
  left join lateral (
    select
      case when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where status in ('present','late')) / count(*), 0)
      end::numeric as attendance_rate,
      max(updated_at) as last_attendance
    from public.attendance where user_id = p.id
  ) attendance_stats on true
  left join lateral (
    select
      coalesce(round(avg(completion_percent), 0), 0)::numeric as plan_completion,
      max(updated_at) as last_plan
    from public.weekly_plans where user_id = p.id
  ) plan_stats on true
  where p.status = 'active'
    and (target_user_id is null or p.id = target_user_id)
    and (
      (target_user_id is null and p.sponsor_id = auth.uid())
      or (
        target_user_id is not null
        and (
          p.sponsor_id = auth.uid()
          or public.current_role() = 'admin'
          or (
            public.current_role() = 'team_leader'
            and membership.office_id = public.current_office_id()
          )
        )
      )
    )
  order by o.name nulls last, p.full_name;
$$;

grant execute on function public.downline_performance(uuid) to authenticated;
