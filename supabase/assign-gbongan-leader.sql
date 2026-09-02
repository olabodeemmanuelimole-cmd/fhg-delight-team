-- Link the overall administrator as leader of the Gbongan office.
-- This preserves the admin role and adds office-leader capability through offices.leader_id.

do $$
declare target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower('olabodeemmanuelimole@gmail.com')
  limit 1;

  if target_user_id is null then raise exception 'Administrator account was not found'; end if;

  update public.offices
  set leader_id = target_user_id,
      leader_display_name = 'Mr Emmanuel Olabode'
  where name = 'Delight Team Office — Gbongan';

  if not found then raise exception 'Gbongan office was not found'; end if;
end;
$$;

