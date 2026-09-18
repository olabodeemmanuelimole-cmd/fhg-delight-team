-- Run this entire SQL file in Supabase SQL Editor. No frontend deploy required.
-- Qualifies profile columns to avoid collisions with RETURNS TABLE variables.
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
revoke all on function public.office_attendance_today(uuid) from public,anon;
grant execute on function public.office_attendance_today(uuid) to authenticated;
