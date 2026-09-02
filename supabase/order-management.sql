-- Editable orders, platform fees, completion dates, and owner-controlled deletion.

alter table public.orders add column if not exists fee_percent numeric(5,2) not null default 0;
alter table public.orders add column if not exists completed_at timestamptz;

do $$ begin
  alter table public.orders add constraint orders_fee_percent_range check (fee_percent between 0 and 100);
exception when duplicate_object then null;
end $$;

update public.orders
set fee_percent = case
  when lower(platform)='upwork' then 10
  when lower(platform)='fiverr' then 20
  else fee_percent
end;

update public.orders
set completed_at=coalesce(completed_at,updated_at,created_at)
where status='completed';

drop policy if exists "members delete own orders" on public.orders;
create policy "members delete own orders" on public.orders
for delete using (user_id=auth.uid());
