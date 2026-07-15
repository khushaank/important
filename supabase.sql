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

-- Lock the app to the owner of its earliest existing task. If the table is
-- empty, insert the intended auth.users UUID into this table before use.
create schema if not exists super_important_tasks_private;
revoke all on schema super_important_tasks_private from public, anon;

create table if not exists super_important_tasks_private.owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);

insert into super_important_tasks_private.owner (singleton, user_id)
select true, user_id
from public.super_important_tasks_kh_7f3a9c
order by created_at, id
limit 1
on conflict (singleton) do nothing;

create or replace function super_important_tasks_private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from super_important_tasks_private.owner
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
