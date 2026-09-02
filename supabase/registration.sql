insert into public.offices (name, location)
values
  ('Ikeja Central', 'Lagos'),
  ('Lekki Growth Hub', 'Lagos'),
  ('Abuja Central', 'Abuja')
on conflict (name) do nothing;

create or replace function public.complete_registration(
  selected_office_id uuid,
  selected_sponsor_id uuid default null,
  selected_rank text default 'Newbie',
  member_phone text default null,
  member_bio text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.offices where id = selected_office_id and active) then
    raise exception 'Selected office is unavailable';
  end if;
  if selected_sponsor_id = auth.uid() then raise exception 'A member cannot sponsor themselves'; end if;

  update public.profiles
  set sponsor_id = selected_sponsor_id,
      rank = coalesce(nullif(selected_rank, ''), 'Newbie'),
      phone = nullif(member_phone, ''),
      updated_at = now()
  where id = auth.uid();

  insert into public.office_memberships (user_id, office_id)
  values (auth.uid(), selected_office_id)
  on conflict (user_id, ended_at) do update set office_id = excluded.office_id;
end;
$$;

grant execute on function public.complete_registration(uuid, uuid, text, text, text) to authenticated;
