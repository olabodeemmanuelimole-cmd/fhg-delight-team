-- Install after creative-hub-foundation.sql. Private admin-only generation test.
begin;
create table if not exists public.illustration_generations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id),
 project_id uuid not null references public.creative_projects(id),
 request_id uuid not null unique,
 prompt text not null,
 status text not null default 'pending' check(status in ('pending','complete','failed')),
 storage_path text,
 created_at timestamptz not null default now()
);
alter table public.illustration_generations enable row level security;
revoke all on public.illustration_generations from anon, authenticated;
grant select on public.illustration_generations to authenticated;
drop policy if exists illustration_own_read on public.illustration_generations;
create policy illustration_own_read on public.illustration_generations for select to authenticated using(owner_id=auth.uid());
create index if not exists illustration_owner_created on public.illustration_generations(owner_id,created_at);
-- Only the server may reserve attempts. A lock makes the daily limit concurrency-safe.
create or replace function public.reserve_illustration(p_owner uuid,p_project uuid,p_request uuid,p_prompt text)
returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 if not exists(select 1 from profiles where id=p_owner and status='active' and role='admin') then raise exception 'Administrator access required'; end if;
 if not exists(select 1 from creative_projects where id=p_project and owner_id=p_owner and tool_id='illustration') then raise exception 'Project unavailable'; end if;
 if length(p_prompt)>6000 or length(trim(p_prompt))=0 then raise exception 'Invalid prompt'; end if;
 if exists(select 1 from illustration_generations where request_id=p_request) then raise exception 'This request was already submitted. Refresh the artwork list before retrying.'; end if;
 if exists(select 1 from illustration_generations where owner_id=p_owner and created_at>now()-interval '60 seconds') then raise exception 'Wait one minute between attempts'; end if;
 if (select count(*) from illustration_generations where owner_id=p_owner and created_at>now()-interval '24 hours')>=10 then raise exception 'Test limit reached: 10 attempts in 24 hours'; end if;
 insert into illustration_generations(owner_id,project_id,request_id,prompt) values(p_owner,p_project,p_request,p_prompt) returning id into result;
 return result;
end; $$;
revoke all on function public.reserve_illustration(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_illustration(uuid,uuid,uuid,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('illustration-artwork','illustration-artwork',false,15728640,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
drop policy if exists illustration_artwork_read on storage.objects;
create policy illustration_artwork_read on storage.objects for select to authenticated
 using(bucket_id='illustration-artwork' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
