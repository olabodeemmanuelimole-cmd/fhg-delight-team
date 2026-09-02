-- Safe office and member lifecycle controls.
-- Run this file once in the Supabase SQL Editor.

create or replace function public.set_office_member_status(
  target_user_id uuid,
  new_status text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.app_role;
  target_office uuid;
begin
  if new_status not in ('pending', 'active', 'suspended') then
    raise exception 'Invalid member status';
  end if;

  select role into target_role from public.profiles where id = target_user_id;
  select office_id into target_office from public.office_memberships
  where user_id = target_user_id and ended_at is null limit 1;

  if target_role is null then raise exception 'Member not found'; end if;
  if target_user_id = auth.uid() then raise exception 'You cannot change your own access status'; end if;
  if target_role = 'admin' then raise exception 'Administrator access cannot be changed here'; end if;
  if target_role = 'team_leader' and public.current_role() <> 'admin' then
    raise exception 'Only the overall admin can change a team leader status';
  end if;
  if public.current_role() <> 'admin' and not (
    public.current_role() = 'team_leader' and target_office = public.current_office_id()
  ) then
    raise exception 'You cannot manage members outside your office';
  end if;

  update public.profiles
  set status = new_status::public.membership_status, updated_at = now()
  where id = target_user_id;

  perform public.write_audit(
    'member_status_changed', 'profile', target_user_id::text,
    jsonb_build_object('status', new_status, 'office_id', target_office)
  );
end;
$$;

create or replace function public.admin_delete_empty_office(target_office_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare office_name text;
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  select name into office_name from public.offices where id = target_office_id;
  if office_name is null then raise exception 'Office not found'; end if;

  if exists (select 1 from public.office_memberships where office_id = target_office_id)
    or exists (select 1 from public.attendance where office_id = target_office_id)
    or exists (select 1 from public.office_transfers where from_office_id = target_office_id or to_office_id = target_office_id)
    or exists (select 1 from public.announcements where office_id = target_office_id)
    or exists (select 1 from public.feedback_messages where office_id = target_office_id)
    or exists (select 1 from public.team_events where office_id = target_office_id)
  then
    raise exception 'This office has linked records. Archive it instead to preserve history.';
  end if;

  perform public.write_audit('office_deleted', 'office', target_office_id::text, jsonb_build_object('name', office_name));
  delete from public.offices where id = target_office_id;
end;
$$;

create or replace function public.admin_delete_member_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare target_role public.app_role;
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  if target_user_id = auth.uid() then raise exception 'You cannot delete your own administrator account'; end if;
  select role into target_role from public.profiles where id = target_user_id;
  if target_role is null then raise exception 'Member not found'; end if;
  if target_role = 'admin' then raise exception 'Administrator accounts cannot be deleted here'; end if;

  if exists (select 1 from public.announcements where author_id = target_user_id)
    or exists (select 1 from public.feedback_messages where sender_id = target_user_id or recipient_id = target_user_id)
    or exists (select 1 from public.team_events where creator_id = target_user_id)
    or exists (select 1 from public.cash_transactions where created_by = target_user_id)
  then
    raise exception 'This member owns protected communication or finance history. Suspend the account instead.';
  end if;

  perform public.write_audit('member_deleted', 'profile', target_user_id::text);
  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.set_office_member_status(uuid, text) to authenticated;
grant execute on function public.admin_delete_empty_office(uuid) to authenticated;
grant execute on function public.admin_delete_member_account(uuid) to authenticated;
