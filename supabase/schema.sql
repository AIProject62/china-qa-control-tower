-- China QA Control Tower - Supabase production schema
-- Run once in Supabase SQL Editor. This script intentionally uses only browser-safe publishable-key access + RLS.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.qa_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('viewer','admin')),
  created_at timestamptz not null default now()
);

create or replace function private.qa_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.qa_profiles p where p.user_id=(select auth.uid()) and p.role='admin');
$$;

create or replace function private.qa_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.qa_profiles(user_id,email,role) values(new.id,new.email,'viewer') on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists qa_on_auth_user_created on auth.users;
create trigger qa_on_auth_user_created after insert on auth.users for each row execute procedure private.qa_handle_new_user();

create table if not exists public.qa_versions (
  id uuid primary key default gen_random_uuid(),
  version_code text not null unique,
  status text not null default 'staging' check(status in ('staging','published','archived','failed')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  published_at timestamptz,
  notes text,
  quality_count integer not null default 0,
  production_count integer not null default 0,
  evidence_count integer not null default 0,
  ready_count integer not null default 0,
  unresolved_count integer not null default 0
);

create table if not exists public.qa_quality_rows (
  id bigint generated always as identity primary key,
  version_id uuid not null references public.qa_versions(id) on delete cascade,
  row_no integer not null,
  payload jsonb not null,
  unique(version_id,row_no)
);
create index if not exists qa_quality_rows_version_idx on public.qa_quality_rows(version_id,row_no);

create table if not exists public.qa_production_rows (
  id bigint generated always as identity primary key,
  version_id uuid not null references public.qa_versions(id) on delete cascade,
  row_no integer not null,
  payload jsonb not null,
  unique(version_id,row_no)
);
create index if not exists qa_production_rows_version_idx on public.qa_production_rows(version_id,row_no);

create table if not exists public.qa_evidence_rows (
  id bigint generated always as identity primary key,
  version_id uuid not null references public.qa_versions(id) on delete cascade,
  row_no integer not null,
  payload jsonb not null,
  unique(version_id,row_no)
);
create index if not exists qa_evidence_rows_version_idx on public.qa_evidence_rows(version_id,row_no);


create table if not exists public.qa_engine_config (
  config_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.qa_app_state (
  id integer primary key check(id=1),
  published_version_id uuid references public.qa_versions(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.qa_app_state(id) values(1) on conflict(id) do nothing;

-- Storage bucket is private. Free projects: individual files must stay under the project's configured max (currently <=50 MB).
insert into storage.buckets(id,name,public,file_size_limit)
values('qa-evidence','qa-evidence',false,52428800)
on conflict(id) do update set public=false, file_size_limit=52428800;

alter table public.qa_profiles enable row level security;
alter table public.qa_versions enable row level security;
alter table public.qa_quality_rows enable row level security;
alter table public.qa_production_rows enable row level security;
alter table public.qa_evidence_rows enable row level security;
alter table public.qa_app_state enable row level security;
alter table public.qa_engine_config enable row level security;

revoke all on public.qa_profiles, public.qa_versions, public.qa_quality_rows, public.qa_production_rows, public.qa_evidence_rows, public.qa_app_state, public.qa_engine_config from anon, authenticated;
grant select on public.qa_profiles, public.qa_versions, public.qa_quality_rows, public.qa_production_rows, public.qa_evidence_rows, public.qa_app_state, public.qa_engine_config to authenticated;
grant insert, update, delete on public.qa_versions, public.qa_quality_rows, public.qa_production_rows, public.qa_evidence_rows, public.qa_app_state, public.qa_engine_config to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Profile access
create policy "qa_profile_self_or_admin_select" on public.qa_profiles for select to authenticated
using ((select auth.uid())=user_id or (select private.qa_is_admin()));

-- Version access: viewers only see LIVE/published metadata; admins see all.
create policy "qa_versions_select" on public.qa_versions for select to authenticated
using (status='published' or (select private.qa_is_admin()));
create policy "qa_versions_admin_insert" on public.qa_versions for insert to authenticated
with check ((select private.qa_is_admin()) and created_by=(select auth.uid()));
create policy "qa_versions_admin_update" on public.qa_versions for update to authenticated
using ((select private.qa_is_admin())) with check ((select private.qa_is_admin()));
create policy "qa_versions_admin_delete" on public.qa_versions for delete to authenticated
using ((select private.qa_is_admin()) and status<>'published');

-- Published data is visible to any signed-in viewer; admins can also read staging/history.
create policy "qa_quality_select" on public.qa_quality_rows for select to authenticated
using ((select private.qa_is_admin()) or exists(select 1 from public.qa_versions v where v.id=version_id and v.status='published'));
create policy "qa_prod_select" on public.qa_production_rows for select to authenticated
using ((select private.qa_is_admin()) or exists(select 1 from public.qa_versions v where v.id=version_id and v.status='published'));
create policy "qa_evidence_select" on public.qa_evidence_rows for select to authenticated
using ((select private.qa_is_admin()) or exists(select 1 from public.qa_versions v where v.id=version_id and v.status='published'));

create policy "qa_quality_admin_insert" on public.qa_quality_rows for insert to authenticated with check ((select private.qa_is_admin()));
create policy "qa_prod_admin_insert" on public.qa_production_rows for insert to authenticated with check ((select private.qa_is_admin()));
create policy "qa_evidence_admin_insert" on public.qa_evidence_rows for insert to authenticated with check ((select private.qa_is_admin()));
create policy "qa_quality_admin_delete" on public.qa_quality_rows for delete to authenticated using ((select private.qa_is_admin()));
create policy "qa_prod_admin_delete" on public.qa_production_rows for delete to authenticated using ((select private.qa_is_admin()));
create policy "qa_evidence_admin_delete" on public.qa_evidence_rows for delete to authenticated using ((select private.qa_is_admin()));


-- Engine configuration (historical batch decode overrides) is protected behind authentication.
-- It is data/config, not shipped inside public GitHub Pages HTML.
create policy "qa_engine_config_select" on public.qa_engine_config for select to authenticated using (true);
create policy "qa_engine_config_admin_insert" on public.qa_engine_config for insert to authenticated
with check ((select private.qa_is_admin()));
create policy "qa_engine_config_admin_update" on public.qa_engine_config for update to authenticated
using ((select private.qa_is_admin())) with check ((select private.qa_is_admin()));
create policy "qa_engine_config_admin_delete" on public.qa_engine_config for delete to authenticated
using ((select private.qa_is_admin()));

-- All authenticated users need the active pointer; only admin can update it.
create policy "qa_state_select" on public.qa_app_state for select to authenticated using (true);
create policy "qa_state_admin_update" on public.qa_app_state for update to authenticated
using ((select private.qa_is_admin())) with check ((select private.qa_is_admin()));
create policy "qa_state_admin_insert" on public.qa_app_state for insert to authenticated
with check ((select private.qa_is_admin()));

-- Evidence storage: authenticated read, admin write.
create policy "qa_evidence_storage_read" on storage.objects for select to authenticated
using (bucket_id='qa-evidence');
create policy "qa_evidence_storage_insert" on storage.objects for insert to authenticated
with check (bucket_id='qa-evidence' and (select private.qa_is_admin()));
create policy "qa_evidence_storage_update" on storage.objects for update to authenticated
using (bucket_id='qa-evidence' and (select private.qa_is_admin())) with check (bucket_id='qa-evidence' and (select private.qa_is_admin()));
create policy "qa_evidence_storage_delete" on storage.objects for delete to authenticated
using (bucket_id='qa-evidence' and (select private.qa_is_admin()));

-- Atomic publish: old LIVE becomes archived, selected version becomes LIVE, app pointer switches in one transaction.
create or replace function public.qa_publish_version(p_version uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not (select private.qa_is_admin()) then raise exception 'Admin role required'; end if;
  if not exists(select 1 from public.qa_versions where id=p_version) then raise exception 'Version not found'; end if;
  update public.qa_versions set status='archived' where status='published' and id<>p_version;
  update public.qa_versions set status='published', published_at=now() where id=p_version;
  update public.qa_app_state set published_version_id=p_version,updated_at=now(),updated_by=(select auth.uid()) where id=1;
end; $$;
grant execute on function public.qa_publish_version(uuid) to authenticated;

-- Free-tier hygiene: keep the newest N versions (plus current published). This deletes old DB rows through cascade.
create or replace function public.qa_prune_versions(p_keep integer default 3)
returns integer language plpgsql security invoker set search_path='' as $$
declare n integer:=0;
begin
  if not (select private.qa_is_admin()) then raise exception 'Admin role required'; end if;
  with doomed as (
    select id from public.qa_versions
    where status<>'published'
    order by created_at desc
    offset greatest(p_keep-1,0)
  )
  delete from public.qa_versions v using doomed d where v.id=d.id;
  get diagnostics n = row_count;
  return n;
end; $$;
grant execute on function public.qa_prune_versions(integer) to authenticated;

-- IMPORTANT: after creating your first Auth user, promote exactly the intended administrator(s):
-- update public.qa_profiles set role='admin' where email='YOUR_ADMIN_EMAIL@COMPANY.COM';
