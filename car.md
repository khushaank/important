# Super Important Tasks — AI handoff

Use this file when connecting Codex, Claude, or ChatGPT to this app.

## Connection

- Site: `https://khushaank.github.io/important/`
- Supabase project: `isbvdvexguygczzgrdpl`
- MCP URL: `https://mcp.supabase.com/mcp?project_ref=isbvdvexguygczzgrdpl&features=database,docs`
- Task table: `public.super_important_tasks_kh_7f3a9c`
- Daily progress: `public.super_important_tasks_daily_progress`

Authorize the Supabase OAuth prompt with the account that owns this project. Keep manual approval enabled for write and delete actions.

Before the first AI write, run the current `supabase.sql` once in the Supabase SQL Editor. That installs the owner-filling insert trigger.

### Codex

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=isbvdvexguygczzgrdpl&features=database,docs"
```

### Claude

```powershell
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=isbvdvexguygczzgrdpl&features=database,docs"
```

### ChatGPT

In ChatGPT developer mode, create an MCP app using the MCP URL above, scan its tools, and complete Supabase OAuth. Full write actions currently require a supported ChatGPT workspace plan; otherwise use Codex or Claude for writes.

## Rules for the AI

1. Use ISO dates (`YYYY-MM-DD`) and the table above.
2. Do not supply `user_id` when adding a task. The database fills the configured owner automatically.
3. Confirm the returned row after every write. Do not claim success from an empty result.
4. Ask before deleting. Adding, editing, moving dates, and completing tasks may be done when requested.
5. Never request or store the PIN, service-role key, database password, or publishable key.

## Task commands

Add for any date:

```sql
insert into public.super_important_tasks_kh_7f3a9c (task_text, task_date)
values ('FR Chapter 2 revision (quick)', date '2026-07-15')
returning id, task_text, task_date, completed;
```

List a date:

```sql
select id, task_text, task_date, completed, completed_on, created_at, updated_at
from public.super_important_tasks_kh_7f3a9c
where task_date = date '2026-07-15'
order by created_at, id;
```

Complete, edit, or move a task using its `id`:

```sql
update public.super_important_tasks_kh_7f3a9c
set completed = true, updated_at = now()
where id = 'TASK_UUID'
returning id, task_text, task_date, completed, completed_on;

update public.super_important_tasks_kh_7f3a9c
set task_text = 'NEW TEXT', task_date = date '2026-07-16', updated_at = now()
where id = 'TASK_UUID'
returning id, task_text, task_date, completed;
```

Delete only after confirmation:

```sql
delete from public.super_important_tasks_kh_7f3a9c
where id = 'TASK_UUID'
returning id, task_text, task_date;
```

## Analytics sheet

When asked for a data sheet, run this query for the requested dates and export the result as CSV or XLSX. `signed_in` means a successful PIN login; a remembered-session refresh is not a new login.

```sql
with days as (
  select generate_series(date '2026-07-01', date '2026-07-31', interval '1 day')::date as day
),
logins as (
  select (attempted_at at time zone 'Asia/Kolkata')::date as day,
         count(*)::integer as login_count
  from super_important_tasks_private.login_attempts
  where succeeded
  group by 1
),
planned as (
  select task_date as day, count(*)::integer as intended
  from public.super_important_tasks_kh_7f3a9c
  group by task_date
),
work as (
  select completed_on as day,
         count(*)::integer as completed,
         (max(updated_at)) at time zone 'Asia/Kolkata' as last_completed_at
  from public.super_important_tasks_kh_7f3a9c
  where completed_on is not null
  group by completed_on
),
progress as (
  select task_date as day, completion_percent
  from public.super_important_tasks_daily_progress
)
select d.day,
       coalesce(l.login_count, 0) > 0 as signed_in,
       coalesce(l.login_count, 0) as login_count,
       coalesce(p.intended, 0) as intended_tasks,
       coalesce(w.completed, 0) as completed_tasks,
       coalesce(pr.completion_percent, 0) as completion_percent,
       w.last_completed_at
from days d
left join logins l using (day)
left join planned p using (day)
left join work w using (day)
left join progress pr using (day)
order by d.day;
```
