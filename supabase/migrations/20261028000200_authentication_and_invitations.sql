begin;
-- All tenant writes remain denied at table level. Only audited RPCs can mutate access.
create table public.invitations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id), branch_id uuid,
 email text not null check(email = lower(trim(email)) and length(email) <= 254 and position('@' in email)>1),
 role_key text not null references public.roles(key),
 token_hash text not null unique check(length(token_hash)=64),
 invited_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null default (now()+interval '7 days'),
 accepted_at timestamptz, accepted_by uuid references auth.users(id), revoked_at timestamptz,
 foreign key (organization_id,branch_id) references public.branches(organization_id,id),
 check(role_key not in ('owner','organization_admin') or branch_id is null),
 check(expires_at > created_at), check(not (accepted_at is not null and revoked_at is not null))
);
create index invitations_scope_created_idx on public.invitations(organization_id,created_at);
create index invitations_branch_idx on public.invitations(organization_id,branch_id);
create index invitations_invited_by_idx on public.invitations(invited_by);
create index invitations_accepted_by_idx on public.invitations(accepted_by);
alter table public.invitations enable row level security;
revoke all on public.invitations from anon,authenticated;
grant select (id,organization_id,branch_id,email,role_key,invited_by,created_at,expires_at,accepted_at,accepted_by,revoked_at) on public.invitations to authenticated;
insert into public.role_permissions(role_key,permission) values
 ('owner','membership.manage'),('organization_admin','membership.manage');
create policy invitations_read_admin on public.invitations for select to authenticated using (private.has_permission(organization_id,null,'membership.manage'));

create function private.ensure_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end $$;
revoke all on function private.ensure_profile() from public;
create trigger auth_user_profile after insert on auth.users for each row execute function private.ensure_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;

create function private.require_confirmed_user() returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
 if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then
  raise exception 'UNAUTHENTICATED' using errcode='42501';
 end if;
 return actor;
end $$;
revoke all on function private.require_confirmed_user() from public;

create function public.bootstrap_organization(organization_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid := private.require_confirmed_user(); new_org uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if exists(select 1 from public.memberships where user_id=actor) then raise exception 'ALREADY_MEMBER'; end if;
 if organization_name is null or length(trim(organization_name)) not between 1 and 200 then raise exception 'VALIDATION_FAILED'; end if;
 insert into public.organizations(name) values(trim(organization_name)) returning id into new_org;
 insert into public.memberships(organization_id,user_id,role_key) values(new_org,actor,'owner');
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id) values(new_org,actor,'organization.bootstrapped','organizations',new_org);
 return new_org;
end $$;

create function public.create_invitation(target_organization uuid,target_email text,target_role text,target_branch uuid default null)
returns text language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_confirmed_user(); raw_token text; invitation_id uuid; is_owner boolean;
begin
 -- Serialize organization access changes before locking membership rows.
 perform 1 from public.organizations where id=target_organization for update;
 perform 1 from public.memberships where organization_id=target_organization and user_id=actor and branch_id is null for update;
 if not private.has_permission(target_organization,null,'membership.manage') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 is_owner := exists(select 1 from public.memberships where organization_id=target_organization and user_id=actor and role_key='owner' and branch_id is null);
 if target_role in ('owner','organization_admin') and not is_owner then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if target_email is null or length(trim(target_email))>254 or position('@' in target_email)<2 then raise exception 'VALIDATION_FAILED'; end if;
 raw_token := gen_random_uuid()::text || gen_random_uuid()::text;
 insert into public.invitations(organization_id,branch_id,email,role_key,token_hash,invited_by)
 values(target_organization,target_branch,lower(trim(target_email)),target_role,encode(sha256(convert_to(raw_token,'UTF8')),'hex'),actor) returning id into invitation_id;
 insert into public.audit_logs(organization_id,branch_id,actor_id,action,entity_type,entity_id) values(target_organization,target_branch,actor,'invitation.created','invitations',invitation_id);
 return raw_token;
end $$;

create function public.accept_invitation(invitation_token text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_confirmed_user(); invite public.invitations; confirmed_email text;
begin
 select lower(email) into confirmed_email from auth.users where id=actor;
 select * into invite from public.invitations where token_hash=encode(sha256(convert_to(invitation_token,'UTF8')),'hex') for update;
 if not found or invite.accepted_at is not null or invite.revoked_at is not null or invite.expires_at<=now() or invite.email is distinct from confirmed_email then
  raise exception 'INVALID_INVITATION';
 end if;
 -- A removed/demoted inviter cannot leave a valid privileged invitation behind.
 perform 1 from public.organizations where id=invite.organization_id for update;
 perform 1 from public.memberships where organization_id=invite.organization_id and user_id=invite.invited_by and branch_id is null for update;
 if not exists(select 1 from public.memberships where organization_id=invite.organization_id and user_id=invite.invited_by and branch_id is null
  and (role_key='owner' or (role_key='organization_admin' and invite.role_key not in ('owner','organization_admin')))) then raise exception 'INVALID_INVITATION'; end if;
 insert into public.memberships(organization_id,user_id,branch_id,role_key) values(invite.organization_id,actor,invite.branch_id,invite.role_key) on conflict do nothing;
 update public.invitations set accepted_at=now(),accepted_by=actor where id=invite.id;
 insert into public.audit_logs(organization_id,branch_id,actor_id,action,entity_type,entity_id) values(invite.organization_id,invite.branch_id,actor,'invitation.accepted','invitations',invite.id);
 return invite.organization_id;
end $$;

create function public.revoke_invitation(invitation_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_confirmed_user(); invite public.invitations; is_owner boolean;
begin
 select * into invite from public.invitations where id=invitation_id for update;
 if not found then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 perform 1 from public.organizations where id=invite.organization_id for update;
 perform 1 from public.memberships where organization_id=invite.organization_id and user_id=actor and branch_id is null for update;
 if not private.has_permission(invite.organization_id,null,'membership.manage') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 is_owner:=exists(select 1 from public.memberships where organization_id=invite.organization_id and user_id=actor and role_key='owner' and branch_id is null);
 if invite.role_key in ('owner','organization_admin') and not is_owner then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if invite.accepted_at is not null or invite.revoked_at is not null then raise exception 'CONFLICT'; end if;
 update public.invitations set revoked_at=now() where id=invite.id;
 insert into public.audit_logs(organization_id,branch_id,actor_id,action,entity_type,entity_id) values(invite.organization_id,invite.branch_id,actor,'invitation.revoked','invitations',invite.id);
end $$;

create function public.revoke_membership(membership_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_confirmed_user(); target public.memberships; is_owner boolean;
begin
 -- Serialize access changes per organization, including the last-owner check.
 select * into target from public.memberships where id=membership_id;
 if not found then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 perform 1 from public.organizations where id=target.organization_id for update;
 select * into target from public.memberships where id=membership_id for update;
 if not found then raise exception 'CONFLICT'; end if;
 if not private.has_permission(target.organization_id,null,'membership.manage') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 is_owner:=exists(select 1 from public.memberships where organization_id=target.organization_id and user_id=actor and role_key='owner' and branch_id is null);
 if target.role_key in ('owner','organization_admin') and not is_owner then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if target.role_key='owner' and (select count(*) from public.memberships where organization_id=target.organization_id and role_key='owner')<=1 then raise exception 'LAST_OWNER'; end if;
 delete from public.memberships where id=membership_id;
 insert into public.audit_logs(organization_id,branch_id,actor_id,action,entity_type,entity_id) values(target.organization_id,target.branch_id,actor,'membership.revoked','memberships',membership_id);
end $$;
create function public.list_organization_members(target_organization uuid)
returns table(membership_id uuid,user_id uuid,display_name text,email text,role_key text,branch_id uuid,created_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_confirmed_user();
 if not private.has_permission(target_organization,null,'membership.manage') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 return query select m.id,m.user_id,p.display_name,u.email::text,m.role_key,m.branch_id,m.created_at
 from public.memberships m join auth.users u on u.id=m.user_id left join public.profiles p on p.id=m.user_id
 where m.organization_id=target_organization order by m.created_at;
end $$;
revoke all on function public.list_organization_members(uuid) from public,anon;
grant execute on function public.list_organization_members(uuid) to authenticated;
revoke all on function public.bootstrap_organization(text) from public,anon;
revoke all on function public.create_invitation(uuid,text,text,uuid) from public,anon;
revoke all on function public.accept_invitation(text) from public,anon;
revoke all on function public.revoke_invitation(uuid) from public,anon;
revoke all on function public.revoke_membership(uuid) from public,anon;
grant execute on function public.bootstrap_organization(text) to authenticated;
grant execute on function public.create_invitation(uuid,text,text,uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.revoke_membership(uuid) to authenticated;
commit;
