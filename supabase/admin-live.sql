-- Live administration functions. Run once in the Supabase SQL Editor.

create or replace function public.admin_set_profile_status(target_user_id uuid, new_status public.membership_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  update public.profiles set status = new_status, updated_at = now() where id = target_user_id;
  if not found then raise exception 'Member profile not found'; end if;
  if new_status = 'active' then
    update public.office_memberships set approved_by = auth.uid()
    where user_id = target_user_id and ended_at is null;
  end if;
end; $$;

create or replace function public.admin_create_office(
  office_name text,
  office_location text,
  office_leader_name text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare result_id uuid; org_id uuid;
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  if nullif(trim(office_name),'') is null or nullif(trim(office_location),'') is null then
    raise exception 'Office name and location are required';
  end if;
  select id into org_id from public.organizations where active order by created_at limit 1;
  insert into public.offices (name, location, leader_display_name, organization_id, active)
  values (trim(office_name), trim(office_location), nullif(trim(office_leader_name),''), org_id, true)
  returning id into result_id;
  return result_id;
end; $$;

grant execute on function public.admin_set_profile_status(uuid, public.membership_status) to authenticated;
grant execute on function public.admin_create_office(text,text,text) to authenticated;

