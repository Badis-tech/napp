create extension if not exists pgcrypto;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  action text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_id uuid not null references public.roles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_name text not null,
  encrypted_key text not null,
  status text not null default 'active',
  created_by_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint api_keys_status_check check (status in ('active', 'inactive', 'revoked'))
);

create index if not exists profiles_role_id_idx on public.profiles(role_id);
create index if not exists role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index if not exists api_keys_api_name_idx on public.api_keys(api_name);
create index if not exists api_keys_status_idx on public.api_keys(status);
create index if not exists api_keys_created_by_id_idx on public.api_keys(created_by_id);
create unique index if not exists api_keys_created_by_api_name_name_idx
  on public.api_keys(created_by_id, api_name, name);

insert into public.roles (name, description)
values
  ('admin', 'Full system access'),
  ('operator', 'Operational management'),
  ('investor', 'Financial contributor'),
  ('donor', 'Charitable contributor'),
  ('worker', 'Performs tasks'),
  ('student', 'Learner role')
on conflict (name) do update
set description = excluded.description,
    updated_at = now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists set_permissions_updated_at on public.permissions;
create trigger set_permissions_updated_at
before update on public.permissions
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_api_keys_updated_at on public.api_keys;
create trigger set_api_keys_updated_at
before update on public.api_keys
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role_id uuid;
begin
  select id into selected_role_id
  from public.roles
  where name = 'student';

  insert into public.profiles (id, full_name, role_id)
  values (new.id, new.raw_user_meta_data->>'full_name', selected_role_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role_id is distinct from new.role_id and not public.current_user_is_admin() then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and r.name = 'admin'
  );
$$;

drop policy if exists "roles are readable by authenticated users" on public.roles;
create policy "roles are readable by authenticated users"
on public.roles for select
to authenticated
using (true);

drop policy if exists "permissions are readable by authenticated users" on public.permissions;
create policy "permissions are readable by authenticated users"
on public.permissions for select
to authenticated
using (true);

drop policy if exists "role permissions are readable by authenticated users" on public.role_permissions;
create policy "role permissions are readable by authenticated users"
on public.role_permissions for select
to authenticated
using (true);

drop policy if exists "profiles are readable by owner or admin" on public.profiles;
create policy "profiles are readable by owner or admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "profiles are updatable by owner or admin" on public.profiles;
create policy "profiles are updatable by owner or admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.current_user_is_admin())
with check (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "api keys are manageable by owner or admin" on public.api_keys;
create policy "api keys are manageable by owner or admin"
on public.api_keys for all
to authenticated
using (created_by_id = auth.uid() or public.current_user_is_admin())
with check (created_by_id = auth.uid() or public.current_user_is_admin());
