# Super Important Tasks

Private, date-based tasks with server-verified PIN login, daily completion rings, overdue carryover, and Supabase persistence.

## Secure Supabase setup

Anonymous sign-in must stay disabled. The PIN is never stored or checked in the website.

1. In **Authentication -> Users**, create one permanent email user for yourself and copy its UUID.
2. Open the SQL Editor and run `supabase.sql`.
3. Run the setup statement below once, replacing both placeholders. This stores only a bcrypt hash of the PIN.

```sql
insert into super_important_tasks_private.login_config (singleton, user_id, pin_hash)
values (
  true,
  'YOUR_AUTH_USER_UUID',
  extensions.crypt('YOUR_4_DIGIT_PIN', extensions.gen_salt('bf', 10))
)
on conflict (singleton) do update
set user_id = excluded.user_id,
    pin_hash = excluded.pin_hash;
```

If tasks already exist under an older user, migrate them once:

```sql
update public.super_important_tasks_kh_7f3a9c
set user_id = 'YOUR_AUTH_USER_UUID';
```

4. Deploy the login function without JWT pre-verification; it performs the PIN verification itself:

```powershell
supabase functions deploy pin-login --no-verify-jwt
```

5. Set the exact public website address as an Edge Function secret, with no trailing slash:

```powershell
supabase secrets set ALLOWED_ORIGIN=https://YOUR-SITE.example
```

The database allows five failed attempts per network address in 15 minutes and 30 failed attempts globally per hour. Row-level security rejects every task request unless the authenticated user is the configured owner.

## Codex MCP - copy and paste

This installs the project-scoped Supabase MCP in your Codex user configuration, so it is available from the whole repository tree. Replace the project reference before running it:

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&features=database,docs"
```

Keep MCP access for development only. Do not put the service-role key, database password, or PIN in the repository.

## GitHub repository secrets

Open **Repository -> Settings -> Secrets and variables -> Actions -> Repository secrets** and create exactly:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

For `SUPABASE_URL`, save only the URL value, such as:

```text
https://your-project-ref.supabase.co
```

For the key, save only the publishable-key value. Never use a secret or `service_role` key in the website.

## Required GitHub Pages setting

Open **Repository -> Settings -> Pages** and set **Source** to **GitHub Actions**.

Adding or changing a secret does not redeploy an already-published artifact. After adding the secrets:

1. Open **Actions**.
2. Open **Deploy Super Important Tasks**.
3. Select **Run workflow**, or push a new commit.
4. Confirm both `build` and `deploy` are green.

Then hard-refresh the site. On Android Chrome, close the installed tab/app once and reopen it if an older service worker was active.

## PWA installation note

Chromium logs a message saying the banner was not shown when `beforeinstallprompt.preventDefault()` is used. This is expected: the event is deliberately stored so the native install dialog can be opened after a user gesture. It is not a Supabase or deployment error.
