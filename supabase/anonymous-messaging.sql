-- Anonymous office messaging with database-enforced recipient access.
-- The sender's user ID, name, email, rank and status are never stored.

create table if not exists public.anonymous_messages (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  recipient_scope text not null check (recipient_scope in ('office_leader','overall_director','both')),
  message text not null check (char_length(trim(message)) between 3 and 4000),
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);

alter table public.anonymous_messages enable row level security;

-- No direct table access: submission and reading happen only through the
-- guarded functions below. This prevents clients from attaching an identity.
revoke all on table public.anonymous_messages from anon, authenticated;

create or replace function public.submit_anonymous_message(message_body text, send_to text)
returns uuid language plpgsql security definer set search_path=public as $$
declare sender_office uuid; result_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to send an anonymous message'; end if;
  if send_to not in ('office_leader','overall_director','both') then raise exception 'Choose a valid recipient'; end if;
  if char_length(trim(coalesce(message_body,''))) not between 3 and 4000 then raise exception 'Message must contain 3 to 4000 characters'; end if;
  sender_office:=public.current_office_id();
  if sender_office is null then raise exception 'You need an active office before using anonymous messaging'; end if;
  insert into public.anonymous_messages(office_id,recipient_scope,message)
  values(sender_office,send_to,trim(message_body)) returning id into result_id;
  return result_id;
end; $$;

create or replace function public.get_anonymous_messages()
returns table(id uuid,office_name text,recipient_scope text,message text,status text,created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if public.current_role()='admin' then
    return query select m.id,o.name,m.recipient_scope,m.message,m.status,m.created_at
    from public.anonymous_messages m join public.offices o on o.id=m.office_id
    order by m.created_at desc;
  end if;
  if public.current_role()='team_leader' and public.has_full_leader_access() then
    return query select m.id,o.name,m.recipient_scope,m.message,m.status,m.created_at
    from public.anonymous_messages m join public.offices o on o.id=m.office_id
    where m.office_id=public.current_office_id() and m.recipient_scope in ('office_leader','both')
    order by m.created_at desc;
    return;
  end if;
  raise exception 'Anonymous inbox access is restricted';
end; $$;

create or replace function public.update_anonymous_message_status(message_id uuid,new_status text)
returns void language plpgsql security definer set search_path=public as $$
declare allowed boolean;
begin
  if new_status not in ('read','resolved') then raise exception 'Invalid message status'; end if;
  select public.current_role()='admin' or (
    public.current_role()='team_leader' and public.has_full_leader_access()
    and m.office_id=public.current_office_id() and m.recipient_scope in ('office_leader','both')
  ) into allowed from public.anonymous_messages m where m.id=message_id;
  if not coalesce(allowed,false) then raise exception 'Anonymous inbox access is restricted'; end if;
  update public.anonymous_messages set status=new_status where id=message_id;
end; $$;

grant execute on function public.submit_anonymous_message(text,text) to authenticated;
grant execute on function public.get_anonymous_messages() to authenticated;
grant execute on function public.update_anonymous_message_status(uuid,text) to authenticated;
