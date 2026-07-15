# Super Important Tasks

Private, date-based tasks with cross-device sync, a local four-digit device lock, and Supabase persistence.

## Supabase

1. Open Supabase SQL Editor.
2. Run `supabase.sql` once.
3. Enable **Authentication → Sign In / Providers → Anonymous Sign-Ins**.
4. Enable **Authentication → Settings → Allow manual linking** so the laptop's existing anonymous identity can be linked to an email without losing its tasks.
5. Set **Authentication → URL Configuration → Site URL** to the deployed app URL.
6. Copy the **Project URL** and frontend **Publishable key**. Never use a secret or `service_role` key.

`supabase.sql` locks all task rows to the owner of the earliest existing task. If the task table is empty, set the owner once in the SQL Editor:

```sql
insert into super_important_tasks_private.owner (singleton, user_id)
values (true, 'YOUR_AUTH_USER_UUID');
```

The four-digit PIN is a local screen lock stored on that device. Supabase Auth and RLS are the actual data security layer.

## AI task entry with MCP

The repository includes a project-scoped Supabase MCP configuration. Set `SUPABASE_PROJECT_REF` in your local environment, reopen the MCP client, and approve the Supabase OAuth connection. The AI can then insert tasks into `public.super_important_tasks_kh_7f3a9c` for the owner.

Keep manual tool approval enabled. Supabase recommends its hosted MCP server for development rather than production data; this configuration limits the connection to one project and the database/docs feature groups.

## GitHub repository secrets

Open **Repository → Settings → Secrets and variables → Actions → Repository secrets** and create exactly:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

For `SUPABASE_URL`, save only the URL value, such as:

```text
https://your-project-ref.supabase.co
```

For the key, save only the publishable-key value. Do not paste `SUPABASE_URL=` or `SUPABASE_PUBLISHABLE_KEY=`. This version cleans those prefixes and quotation marks if pasted accidentally, but raw values are preferable.

## Required GitHub Pages setting

Open **Repository → Settings → Pages** and set **Source** to **GitHub Actions**.

Adding or changing a secret does not redeploy an already-published artifact. After adding the secrets:

1. Open **Actions**.
2. Open **Deploy Super Important Tasks**.
3. Select **Run workflow**, or push a new commit.
4. Confirm both `build` and `deploy` are green.

Then hard-refresh the site. On Android Chrome, close the installed tab/app once and reopen it if an older service worker was active.

## PWA installation note

Chromium logs a message saying the banner was not shown when `beforeinstallprompt.preventDefault()` is used. This is expected: the event is deliberately stored so the native install dialog can be opened after a user gesture. It is not a Supabase or deployment error.
