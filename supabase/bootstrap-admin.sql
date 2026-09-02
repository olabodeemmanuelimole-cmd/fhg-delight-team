do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email) = lower('olabodeemmanuelimole@gmail.com')
  limit 1;

  if target_user_id is null then
    raise exception 'No registered account was found for olabodeemmanuelimole@gmail.com';
  end if;

  update public.profiles
  set role = 'admin',
      status = 'active',
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'The authentication account exists, but its profile record is missing';
  end if;
end;
$$;
