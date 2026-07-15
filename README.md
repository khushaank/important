# Super Important Tasks

Private, date-based tasks with a fixed `5514` screen lock, daily completion rings, overdue carryover, and Supabase persistence.

## Supabase

1. Open Supabase SQL Editor.
2. Run `supabase.sql` once.
3. Enable **Authentication → Sign In / Providers → Anonymous Sign-Ins**.
4. Copy the **Project URL** and frontend **Publishable key**. Never use a secret or `service_role` key.

The fixed PIN is intentionally only a simple screen lock. Task rows remain isolated to the browser's Supabase user by row-level security.

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
