-- Super Important Tasks
-- Intentionally uncommon table name to avoid clashes with existing tables.
-- Safe to run more than once.

create table if not exists public.super_important_tasks_kh_7f3a9c (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_text text not null,
  task_date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint super_important_tasks_kh_7f3a9c_text_length
    check (char_length(btrim(task_text)) between 1 and 200)
);

create index if not exists super_important_tasks_kh_7f3a9c_user_date_created_idx
  on public.super_important_tasks_kh_7f3a9c (user_id, task_date, created_at, id);

alter table public.super_important_tasks_kh_7f3a9c enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'super_important_tasks_kh_7f3a9c'
  ) then
    alter publication supabase_realtime add table public.super_important_tasks_kh_7f3a9c;
  end if;
end;
$$;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists super_important_tasks_private;
revoke all on schema super_important_tasks_private from public, anon, authenticated;

create table if not exists super_important_tasks_private.login_config (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  pin_hash text not null
);

create table if not exists super_important_tasks_private.login_attempts (
  ip_hash bytea not null,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null
);

create index if not exists super_important_tasks_login_attempts_time_idx
  on super_important_tasks_private.login_attempts (attempted_at);

create index if not exists super_important_tasks_login_attempts_ip_time_idx
  on super_important_tasks_private.login_attempts (ip_hash, attempted_at)
  where not succeeded;

alter table super_important_tasks_private.login_config enable row level security;
alter table super_important_tasks_private.login_attempts enable row level security;
revoke all on all tables in schema super_important_tasks_private from public, anon, authenticated;

create or replace function public.verify_super_tasks_pin(p_pin text, p_ip text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip_hash bytea := extensions.digest(coalesce(p_ip, ''), 'sha256');
  v_user_id uuid;
begin
  -- ponytail: one global lock suits this single-user app; use per-IP locks if login throughput ever matters.
  perform pg_catalog.pg_advisory_xact_lock(903271);

  delete from super_important_tasks_private.login_attempts
  where attempted_at < now() - interval '7 days';

  if (select count(*)
      from super_important_tasks_private.login_attempts
      where ip_hash = v_ip_hash
        and not succeeded
        and attempted_at > now() - interval '15 minutes') >= 5
    or (select count(*)
        from super_important_tasks_private.login_attempts
        where not succeeded
          and attempted_at > now() - interval '1 hour') >= 30 then
    return null;
  end if;

  if p_pin ~ '^[0-9]{4}$' then
    select user_id
    into v_user_id
    from super_important_tasks_private.login_config
    where pin_hash = extensions.crypt(p_pin, pin_hash);
  end if;

  insert into super_important_tasks_private.login_attempts (ip_hash, succeeded)
  values (v_ip_hash, v_user_id is not null);

  return v_user_id;
end;
$$;

revoke all on function public.verify_super_tasks_pin(text, text) from public, anon, authenticated;
grant execute on function public.verify_super_tasks_pin(text, text) to service_role;

create or replace function super_important_tasks_private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from super_important_tasks_private.login_config
    where user_id = (select auth.uid())
  );
$$;

revoke all on function super_important_tasks_private.is_owner() from public, anon;
grant usage on schema super_important_tasks_private to authenticated;
grant execute on function super_important_tasks_private.is_owner() to authenticated;

revoke all on table public.super_important_tasks_kh_7f3a9c from anon;

grant usage on schema public to authenticated;

grant select, insert, update, delete
  on table public.super_important_tasks_kh_7f3a9c
  to authenticated;

drop policy if exists "kh_tasks_select_own" on public.super_important_tasks_kh_7f3a9c;
create policy "kh_tasks_select_own"
  on public.super_important_tasks_kh_7f3a9c
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select super_important_tasks_private.is_owner())
  );

drop policy if exists "kh_tasks_insert_own" on public.super_important_tasks_kh_7f3a9c;
create policy "kh_tasks_insert_own"
  on public.super_important_tasks_kh_7f3a9c
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select super_important_tasks_private.is_owner())
  );

drop policy if exists "kh_tasks_update_own" on public.super_important_tasks_kh_7f3a9c;
create policy "kh_tasks_update_own"
  on public.super_important_tasks_kh_7f3a9c
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select super_important_tasks_private.is_owner())
  )
  with check (
    (select auth.uid()) = user_id
    and (select super_important_tasks_private.is_owner())
  );

drop policy if exists "kh_tasks_delete_own" on public.super_important_tasks_kh_7f3a9c;
create policy "kh_tasks_delete_own"
  on public.super_important_tasks_kh_7f3a9c
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and (select super_important_tasks_private.is_owner())
  );

comment on table public.super_important_tasks_kh_7f3a9c is
  'Date-based super important tasks, isolated per Supabase Auth user by RLS.';
