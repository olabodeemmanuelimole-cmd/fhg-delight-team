-- Repair the audit helper required by member approval and add leader/admin activity notifications.
-- Run once in the Supabase SQL Editor.

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.write_audit(
  action_name text,
  entity_name text,
  entity_key text,
  audit_details jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),action_name,entity_name,entity_key,coalesce(audit_details,'{}'::jsonb));
end;
$$;

alter table public.notifications add column if not exists related_type text;
alter table public.notifications add column if not exists related_id uuid;

create or replace function public.notify_member_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare member_name text;
begin
  select coalesce(full_name,'A new member') into member_name from public.profiles where id=new.user_id;
  insert into public.notifications(user_id,title,message,kind,related_type,related_id)
  select distinct recipient_id,'New member awaiting approval',member_name || ' registered in your office.','member_registration','members',new.user_id
  from (
    select id as recipient_id from public.profiles where role='admin'
    union
    select leader_id from public.offices where id=new.office_id and leader_id is not null
  ) recipients
  where recipient_id is not null and recipient_id<>new.user_id;
  return new;
end;
$$;

drop trigger if exists notify_member_registration_trigger on public.office_memberships;
create trigger notify_member_registration_trigger
after insert on public.office_memberships
for each row execute function public.notify_member_registration();

create or replace function public.notify_member_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_user uuid;
  activity_office uuid;
  member_name text;
  activity_title text;
  activity_message text;
  destination text;
begin
  if tg_table_name='cash_transactions' then
    select book.owner_id, membership.office_id into activity_user,activity_office
    from public.cash_books book
    left join public.office_memberships membership on membership.user_id=book.owner_id and membership.ended_at is null
    where book.id=new.book_id and book.visibility='office';
    if activity_user is null then return new; end if;
    activity_title:='New office Finance entry';
    activity_message:=' added an office-visible Finance entry.';
    destination:='books';
  else
    activity_user:=new.user_id;
    select office_id into activity_office from public.office_memberships where user_id=activity_user and ended_at is null limit 1;
    if tg_table_name='orders' then
      activity_title:='New freelance order'; activity_message:=' added a freelance order.'; destination:='orders';
    elsif tg_table_name='weekly_plans' then
      activity_title:='Weekly plan submitted'; activity_message:=' submitted a weekly plan.'; destination:='plans';
    elsif tg_table_name='attendance' and new.status='absent' then
      activity_title:='Absence reported'; activity_message:=' submitted an absence report for review.'; destination:='attendance';
    else
      return new;
    end if;
  end if;

  select coalesce(full_name,'A member') into member_name from public.profiles where id=activity_user;
  insert into public.notifications(user_id,title,message,kind,related_type,related_id)
  select distinct recipient_id,activity_title,member_name || activity_message,'member_activity',destination,new.id
  from (
    select id as recipient_id from public.profiles where role='admin'
    union
    select leader_id from public.offices where id=activity_office and leader_id is not null
  ) recipients
  where recipient_id is not null and recipient_id<>activity_user;
  return new;
end;
$$;

drop trigger if exists notify_order_activity_trigger on public.orders;
create trigger notify_order_activity_trigger after insert on public.orders
for each row execute function public.notify_member_activity();

drop trigger if exists notify_plan_activity_trigger on public.weekly_plans;
create trigger notify_plan_activity_trigger after insert on public.weekly_plans
for each row execute function public.notify_member_activity();

drop trigger if exists notify_attendance_activity_trigger on public.attendance;
create trigger notify_attendance_activity_trigger after insert on public.attendance
for each row execute function public.notify_member_activity();

drop trigger if exists notify_finance_activity_trigger on public.cash_transactions;
create trigger notify_finance_activity_trigger after insert on public.cash_transactions
for each row execute function public.notify_member_activity();
