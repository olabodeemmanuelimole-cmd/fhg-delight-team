-- Secure office-specific invitations for prospective team leaders.
-- Registration never grants access by itself: the overall admin must approve it.

create table if not exists public.team_leader_invitations (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  claimed_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','claimed','approved','revoked','expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists one_open_leader_invitation_per_office
on public.team_leader_invitations (office_id)
where status in ('pending','claimed');

alter table public.team_leader_invitations enable row level security;

drop policy if exists "admins read leader invitations" on public.team_leader_invitations;
create policy "admins read leader invitations" on public.team_leader_invitations
for select using (public.current_role() = 'admin' or claimed_by = auth.uid());

create or replace function public.admin_create_team_leader_invitation(target_office_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare invitation_token uuid;
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  if not exists (select 1 from public.offices where id=target_office_id and active and leader_id is null) then
    raise exception 'This office is unavailable or already has a team leader';
  end if;

  update public.team_leader_invitations set status='expired'
  where office_id=target_office_id and status in ('pending','claimed') and expires_at <= now();

  select token into invitation_token from public.team_leader_invitations
  where office_id=target_office_id and status in ('pending','claimed') and expires_at > now()
  limit 1;

  if invitation_token is null then
    insert into public.team_leader_invitations (office_id,created_by)
    values (target_office_id,auth.uid()) returning token into invitation_token;
  end if;
  return invitation_token;
end; $$;

create or replace function public.claim_team_leader_invitation(invitation_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare invitation public.team_leader_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into invitation from public.team_leader_invitations where token=invitation_token for update;
  if not found or invitation.status not in ('pending','claimed') then raise exception 'This invitation is no longer available'; end if;
  if invitation.expires_at <= now() then
    update public.team_leader_invitations set status='expired' where id=invitation.id;
    raise exception 'This invitation has expired';
  end if;
  if invitation.claimed_by is not null and invitation.claimed_by <> auth.uid() then raise exception 'This invitation has already been claimed'; end if;
  if not exists (select 1 from public.office_memberships where user_id=auth.uid() and office_id=invitation.office_id and ended_at is null) then
    raise exception 'Complete registration for the invited office first';
  end if;
  update public.team_leader_invitations
  set claimed_by=auth.uid(),status='claimed',claimed_at=coalesce(claimed_at,now())
  where id=invitation.id;
end; $$;

create or replace function public.admin_approve_team_leader_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare invitation public.team_leader_invitations%rowtype; member_name text;
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  select * into invitation from public.team_leader_invitations where id=invitation_id for update;
  if not found or invitation.status <> 'claimed' or invitation.claimed_by is null then raise exception 'This invitation is not ready for approval'; end if;
  if exists (select 1 from public.offices where id=invitation.office_id and leader_id is not null and leader_id<>invitation.claimed_by) then
    raise exception 'This office already has a different team leader';
  end if;
  select full_name into member_name from public.profiles where id=invitation.claimed_by;
  update public.profiles set role='team_leader',status='active',updated_at=now() where id=invitation.claimed_by and role<>'admin';
  update public.profiles set status='active',updated_at=now() where id=invitation.claimed_by and role='admin';
  update public.office_memberships set approved_by=auth.uid() where user_id=invitation.claimed_by and office_id=invitation.office_id and ended_at is null;
  update public.offices set leader_id=invitation.claimed_by,leader_display_name=member_name where id=invitation.office_id;
  update public.team_leader_invitations set status='approved',decided_at=now(),decided_by=auth.uid() where id=invitation.id;
end; $$;

create or replace function public.admin_revoke_team_leader_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role() <> 'admin' then raise exception 'Administrator access required'; end if;
  update public.team_leader_invitations set status='revoked',decided_at=now(),decided_by=auth.uid()
  where id=invitation_id and status in ('pending','claimed');
  if not found then raise exception 'Open invitation not found'; end if;
end; $$;

grant execute on function public.admin_create_team_leader_invitation(uuid) to authenticated;
grant execute on function public.claim_team_leader_invitation(uuid) to authenticated;
grant execute on function public.admin_approve_team_leader_invitation(uuid) to authenticated;
grant execute on function public.admin_revoke_team_leader_invitation(uuid) to authenticated;
