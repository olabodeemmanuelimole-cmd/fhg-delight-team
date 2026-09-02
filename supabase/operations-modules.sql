-- Transfers, audit history, and profile settings.

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null, entity_type text not null, entity_id text,
  details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists "admins read audit log" on public.audit_log;
create policy "admins read audit log" on public.audit_log for select using (public.current_role()='admin');

create or replace function public.write_audit(action_name text, entity_name text, entity_key text, audit_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin insert into public.audit_log(actor_id,action,entity_type,entity_id,details) values(auth.uid(),action_name,entity_name,entity_key,audit_details); end; $$;

create or replace function public.request_office_transfer(target_office_id uuid, transfer_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare current_office uuid; result_id uuid;
begin current_office:=public.current_office_id();
if current_office is null then raise exception 'No active office assignment'; end if;
if current_office=target_office_id then raise exception 'Choose a different office'; end if;
if not exists(select 1 from public.offices where id=target_office_id and active) then raise exception 'Target office is unavailable'; end if;
if exists(select 1 from public.office_transfers where user_id=auth.uid() and status='pending') then raise exception 'You already have a pending transfer'; end if;
insert into public.office_transfers(user_id,from_office_id,to_office_id,reason) values(auth.uid(),current_office,target_office_id,transfer_reason) returning id into result_id;
perform public.write_audit('transfer_requested','office_transfer',result_id::text,jsonb_build_object('from',current_office,'to',target_office_id)); return result_id; end; $$;

create or replace function public.decide_office_transfer(transfer_id uuid, decision text)
returns void language plpgsql security definer set search_path=public as $$
declare item public.office_transfers%rowtype;
begin select * into item from public.office_transfers where id=transfer_id and status='pending';
if not found then raise exception 'Pending transfer not found'; end if;
if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
if public.current_role()<>'admin' and not(public.current_role()='team_leader' and item.to_office_id=public.current_office_id()) then raise exception 'Approval access required'; end if;
update public.office_transfers set status=decision::public.transfer_status,decided_at=now(),decided_by=auth.uid() where id=transfer_id;
if decision='approved' then update public.office_memberships set ended_at=now() where user_id=item.user_id and ended_at is null;
insert into public.office_memberships(user_id,office_id,approved_by) values(item.user_id,item.to_office_id,auth.uid()); end if;
perform public.write_audit('transfer_'||decision,'office_transfer',transfer_id::text,jsonb_build_object('user',item.user_id)); end; $$;

create or replace function public.update_my_profile(new_full_name text,new_phone text default null)
returns void language plpgsql security definer set search_path=public as $$
begin if nullif(trim(new_full_name),'') is null then raise exception 'Full name is required'; end if;
update public.profiles set full_name=trim(new_full_name),phone=nullif(trim(new_phone),''),updated_at=now() where id=auth.uid();
perform public.write_audit('profile_updated','profile',auth.uid()::text); end; $$;

grant execute on function public.request_office_transfer(uuid,text) to authenticated;
grant execute on function public.decide_office_transfer(uuid,text) to authenticated;
grant execute on function public.update_my_profile(text,text) to authenticated;

