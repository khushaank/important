# Super Important Tasks

A private daily task list with server-verified PIN login, optional remembered sessions, event-driven device sync, overdue carryover, and daily progress.

## How sign-in and sync work

- **Keep this device signed in** stores the Supabase session on that device.
- A trusted device also remembers which local task list to open, so the installed app can reopen without Wi-Fi or a PIN prompt.
- Leaving it off keeps the session only for the current browser session. Refresh still works; closing the session requires the PIN next time.
- Tasks and edits are saved in this device's IndexedDB first. Offline changes queue locally and sync when the connection returns.
- Offline additions from several devices are merged. If two devices edit the same task, the edit with the newest `updated_at` wins instead of the last device to reconnect.
- Completion is stored separately from the planned date, so late work fills only the day it was actually completed.
- Sync uses Supabase Realtime. It refreshes after a database change and does not poll every second.
- Anonymous sign-in stays disabled. The website never stores or compares the PIN.

## Supabase setup

1. In **Authentication -> Users**, create one permanent email user and copy its UUID.
2. Run [supabase.sql](./supabase.sql) in the SQL Editor. Rerun it after this update to add completion dates, conflict-safe offline merges, MCP inserts, Realtime, and accurate daily progress.
3. Store the owner and a bcrypt hash of your four-digit PIN:

```sql
insert into super_important_tasks_private.login_config (singleton, user_id, pin_hash)
values (
  true,
  'YOUR_AUTH_USER_UUID',
  extensions.crypt('YOUR_4_DIGIT_PIN', extensions.gen_salt('bf', 10))
)
on conflict (singleton) do update
set user_id = excluded.user_id, pin_hash = excluded.pin_hash;
```

If old tasks belong to another Auth user, migrate them once:

```sql
update public.super_important_tasks_kh_7f3a9c
set user_id = 'YOUR_AUTH_USER_UUID';
```

4. Deploy the PIN function and restrict it to the exact website origin:

```powershell
supabase functions deploy pin-login --no-verify-jwt
supabase secrets set ALLOWED_ORIGIN=https://YOUR-SITE.example
```

The database permits five failed PIN attempts per IP in 15 minutes and 30 globally per hour. RLS permits task access only for the configured owner.

## GitHub Pages

Create these repository Actions secrets:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Set **Settings -> Pages -> Source** to **GitHub Actions**, then run **Deploy Super Important Tasks**. Never put the PIN, database password, or service-role key in the repository.

## Optional Codex MCP

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&features=database,docs"
```

See [car.md](./car.md) for the exact project URL, safe task commands, Claude setup, and the analytics-sheet query.
