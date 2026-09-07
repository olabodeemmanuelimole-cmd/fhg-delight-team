-- Controlled member rank changes with leader requests, admin approval,
-- member notifications, and audit history.
-- Run this file once in the Supabase SQL Editor.

create table if not exists public.rank_change_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  old_rank text not null,
  new_rank text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists one_pending_rank_change_per_member
on public.rank_change_requests(member_id) where status='pending';

alter table public.rank_change_requests enable row level security;
drop policy if exists "authorized users read rank requests" on public.rank_change_requests;
create policy "authorized users read rank requests" on public.rank_change_requests for select
to authenticated using (
  public.current_role()='admin'
  or requested_by=auth.uid()
  or member_id=auth.uid()
);

alter table public.notifications add column if not exists related_type text;
alter table public.notifications add column if not exists related_id uuid;

create or replace function public.request_rank_change(
  target_user_id uuid,
  requested_rank text,
  change_reason text default null
) returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  old_rank_value text;
  target_role public.app_role;
  target_office uuid;
  request_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_user_id=auth.uid() then raise exception 'You cannot change your own rank here'; end if;
  if not exists(select 1 from public.ranks where name=requested_rank and active) then
    raise exception 'Selected rank is unavailable';
  end if;

  select rank,role into old_rank_value,target_role from public.profiles where id=target_user_id;
  if old_rank_value is null then raise exception 'Member not found'; end if;
  if target_role='admin' then raise exception 'Administrator rank cannot be changed here'; end if;
  if old_rank_value=requested_rank then raise exception 'Select a different rank'; end if;
  select office_id into target_office from public.office_memberships
  where user_id=target_user_id and ended_at is null limit 1;

  if public.current_role()='admin' then
    update public.profiles set rank=requested_rank,updated_at=now() where id=target_user_id;
    insert into public.notifications(user_id,title,message,kind,related_type,related_id)
    values(target_user_id,'Rank updated','Your rank changed from '||old_rank_value||' to '||requested_rank||'.','rank_change','profile',target_user_id);
    perform public.write_audit('member_rank_changed','profile',target_user_id::text,
      jsonb_build_object('old_rank',old_rank_value,'new_rank',requested_rank,'reason',nullif(trim(change_reason),'')));
    return 'applied';
  end if;

  if public.current_role()<>'team_leader' or target_office is distinct from public.current_office_id() then
    raise exception 'You cannot request rank changes outside your office';
  end if;
  if target_role='team_leader' then raise exception 'Only the overall admin can change a team leader rank'; end if;

  insert into public.rank_change_requests(member_id,requested_by,old_rank,new_rank,reason)
  values(target_user_id,auth.uid(),old_rank_value,requested_rank,nullif(trim(change_reason),''))
  returning id into request_id;

  insert into public.notifications(user_id,title,message,kind,related_type,related_id)
  select id,'Rank change awaiting approval',old_rank_value||' → '||requested_rank,'rank_change_request','orgmembers',request_id
  from public.profiles where role='admin';
  perform public.write_audit('member_rank_change_requested','rank_change_request',request_id::text,
    jsonb_build_object('member_id',target_user_id,'old_rank',old_rank_value,'new_rank',requested_rank,'reason',nullif(trim(change_reason),'')));
  return 'requested';
end;
$$;

create or replace function public.admin_decide_rank_change(
  request_id uuid,
  decision text
) returns void
language plpgsql
security definer
set search_path=public
as $$
declare item public.rank_change_requests%rowtype;
begin
  if public.current_role()<>'admin' then raise exception 'Administrator access required'; end if;
  if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select * into item from public.rank_change_requests where id=request_id and status='pending' for update;
  if item.id is null then raise exception 'Pending rank request not found'; end if;
  if decision='approved' then
    if not exists(select 1 from public.ranks where name=item.new_rank and active) then raise exception 'Requested rank is no longer available'; end if;
    update public.profiles set rank=item.new_rank,updated_at=now() where id=item.member_id;
  end if;
  update public.rank_change_requests set status=decision,reviewed_by=auth.uid(),reviewed_at=now() where id=request_id;
  insert into public.notifications(user_id,title,message,kind,related_type,related_id)
  values(item.member_id,
    case when decision='approved' then 'Rank change approved' else 'Rank change declined' end,
    case when decision='approved' then 'Your rank changed from '||item.old_rank||' to '||item.new_rank||'.' else 'Your requested rank change to '||item.new_rank||' was declined.' end,
    'rank_change','profile',item.member_id);
  perform public.write_audit('member_rank_change_'||decision,'rank_change_request',request_id::text,
    jsonb_build_object('member_id',item.member_id,'old_rank',item.old_rank,'new_rank',item.new_rank,'reason',item.reason));
end;
$$;

grant execute on function public.request_rank_change(uuid,text,text) to authenticated;
grant execute on function public.admin_decide_rank_change(uuid,text) to authenticated;
