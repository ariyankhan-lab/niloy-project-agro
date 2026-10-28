begin;
-- Foundation only: no client organization provisioning or membership writes.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
alter default privileges in schema public revoke execute on functions from public;

create table public.organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 200),
 currency text not null default 'BDT' check (currency = 'BDT'),
 timezone text not null default 'Asia/Dhaka' check (timezone = 'Asia/Dhaka'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.branches (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check (length(trim(name)) between 1 and 200),
 kind text not null check (kind in ('farm','collection_center','distribution')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (organization_id, id), unique (organization_id, name)
);
create table public.farms (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null,
 branch_id uuid not null unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key (organization_id, branch_id) references public.branches(organization_id,id),
 unique (organization_id, id)
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name) <= 200),
 language text not null default 'en' check (language in ('en','bn')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.roles (
 key text primary key, description text not null
);
create table public.role_permissions (
 role_key text not null references public.roles(key), permission text not null,
 primary key (role_key,permission)
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 branch_id uuid, role_key text not null references public.roles(key),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key (organization_id,branch_id) references public.branches(organization_id,id),
 check (role_key not in ('owner','organization_admin') or branch_id is null),
 unique nulls not distinct (organization_id,user_id,branch_id,role_key)
);
create index memberships_user_scope_idx on public.memberships(user_id,organization_id,branch_id);
create index memberships_branch_idx on public.memberships(organization_id,branch_id);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 branch_id uuid, actor_id uuid references auth.users(id) on delete set null,
 action text not null check(length(trim(action)) > 0), entity_type text not null, entity_id uuid,
 created_at timestamptz not null default now(),
 foreign key (organization_id,branch_id) references public.branches(organization_id,id)
);
create index audit_logs_scope_time_idx on public.audit_logs(organization_id,branch_id,created_at);
create index audit_logs_actor_idx on public.audit_logs(actor_id);

insert into public.roles(key,description) values
 ('owner','Owner / Super Admin within an authorized organization; never platform-wide'),
 ('organization_admin','Organization Administrator'), ('farm_manager','Farm Manager'),
 ('collection_manager','Collection Manager'), ('accountant','Accountant'),
 ('veterinarian','Veterinarian'), ('farm_worker','Farm Worker'),
 ('delivery_staff','Delivery Staff'), ('report_viewer','Report Viewer / Auditor');
-- Only foundation permissions exist. Future modules must explicitly add grants.
insert into public.role_permissions(role_key,permission)
 select key,permission from public.roles cross join (values ('organization.read'),('branch.read')) as p(permission);
insert into public.role_permissions(role_key,permission) values
 ('owner','membership.read'),('organization_admin','membership.read'),
 ('owner','audit.read'),('organization_admin','audit.read');

create function private.is_member(target_org uuid) returns boolean
 language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships m where m.user_id = (select auth.uid()) and m.organization_id = target_org)
$$;
create function private.has_permission(target_org uuid, target_branch uuid, required_permission text) returns boolean
 language sql stable security definer set search_path = '' as $$
 select exists (
  select 1 from public.memberships m join public.role_permissions rp on rp.role_key = m.role_key
  where m.user_id = (select auth.uid()) and m.organization_id = target_org
  and rp.permission = required_permission
  and (m.branch_id is null or (target_branch is not null and m.branch_id = target_branch))
 )
$$;
revoke all on function private.is_member(uuid) from public;
revoke all on function private.has_permission(uuid,uuid,text) from public;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_permission(uuid,uuid,text) to authenticated;

create function private.touch_updated_at() returns trigger
 language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
revoke all on function private.touch_updated_at() from public;
create trigger organizations_updated before update on public.organizations for each row execute function private.touch_updated_at();
create trigger branches_updated before update on public.branches for each row execute function private.touch_updated_at();
create trigger farms_updated before update on public.farms for each row execute function private.touch_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger memberships_updated before update on public.memberships for each row execute function private.touch_updated_at();
create function private.validate_farm_branch() returns trigger
 language plpgsql set search_path = '' as $$
 begin
  if not exists(select 1 from public.branches where id = new.branch_id and organization_id = new.organization_id and kind = 'farm') then
   raise exception 'Farm must reference a farm branch';
  end if;
  return new;
 end $$;
revoke all on function private.validate_farm_branch() from public;
create trigger farms_validate_branch before insert or update on public.farms for each row execute function private.validate_farm_branch();
create function private.prevent_farm_kind_change() returns trigger
 language plpgsql set search_path = '' as $$
 begin
  if new.kind <> 'farm' and exists(select 1 from public.farms where branch_id = old.id) then
   raise exception 'A registered farm branch cannot change kind';
  end if;
  return new;
 end $$;
revoke all on function private.prevent_farm_kind_change() from public;
create trigger branches_validate_kind before update of kind on public.branches for each row execute function private.prevent_farm_kind_change();

alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.farms enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_logs enable row level security;

create policy organizations_read on public.organizations for select to authenticated using (private.is_member(id));
create policy branches_read on public.branches for select to authenticated using (private.has_permission(organization_id,id,'branch.read'));
create policy farms_read on public.farms for select to authenticated using (private.has_permission(organization_id,branch_id,'branch.read'));
create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy roles_read on public.roles for select to authenticated using (true);
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);
create policy memberships_read on public.memberships for select to authenticated using (user_id = (select auth.uid()) or private.has_permission(organization_id,null,'membership.read'));
create policy audit_logs_read on public.audit_logs for select to authenticated using (private.has_permission(organization_id,branch_id,'audit.read'));

revoke all on public.organizations, public.branches, public.farms, public.profiles, public.roles, public.role_permissions, public.memberships, public.audit_logs from anon, authenticated;
grant select on public.organizations, public.branches, public.farms, public.profiles, public.roles, public.role_permissions, public.memberships, public.audit_logs to authenticated;
grant update (display_name,language) on public.profiles to authenticated;
-- Provisioning, invitations and audit emission require a separately approved transactional service.
commit;
