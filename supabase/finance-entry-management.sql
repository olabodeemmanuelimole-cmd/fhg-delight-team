-- Finance entry editing and safe deletion.
-- Run this file once in the Supabase SQL Editor.

create or replace function public.update_finance_transaction(
  target_transaction_id uuid, transaction_type text, transaction_amount numeric,
  transaction_description text, transaction_day date, transaction_notes text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if transaction_type not in ('credit','debit') then raise exception 'Invalid entry type'; end if;
  if transaction_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if nullif(trim(transaction_description),'') is null then raise exception 'Description is required'; end if;
  if not exists (
    select 1 from public.cash_transactions transaction
    join public.cash_books book on book.id=transaction.book_id
    where transaction.id=target_transaction_id and book.owner_id=auth.uid()
  ) then raise exception 'Finance entry not found or access denied'; end if;
  if exists (select 1 from public.withdrawals where transaction_id=target_transaction_id) then
    raise exception 'Withdrawal entries cannot be edited. Record a correcting Finance entry instead.';
  end if;
  update public.cash_transactions set entry_type=transaction_type, amount=transaction_amount,
    description=trim(transaction_description), transaction_date=transaction_day,
    notes=nullif(trim(transaction_notes),'') where id=target_transaction_id;
end; $$;

create or replace function public.delete_finance_transaction(target_transaction_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.cash_transactions transaction
    join public.cash_books book on book.id=transaction.book_id
    where transaction.id=target_transaction_id and book.owner_id=auth.uid()
  ) then raise exception 'Finance entry not found or access denied'; end if;
  if exists (select 1 from public.withdrawals where transaction_id=target_transaction_id) then
    raise exception 'Withdrawal entries cannot be deleted because they are part of the withdrawal record.';
  end if;
  delete from public.cash_transactions where id=target_transaction_id;
end; $$;

grant execute on function public.update_finance_transaction(uuid,text,numeric,text,date,text) to authenticated;
grant execute on function public.delete_finance_transaction(uuid) to authenticated;
