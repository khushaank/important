# Super Important Tasks

This project keeps the exact visual design from the supplied `index.html` and replaces only the application logic.

## 1. Create the database table

1. Open your Supabase project.
2. Open **SQL Editor**.
3. Run the complete contents of `supabase.sql`.
4. Open **Authentication → Sign In / Providers** and enable **Anonymous Sign-Ins**.

The app uses this intentionally uncommon table name:

`super_important_tasks_kh_7f3a9c`

Each browser receives an anonymous Supabase user. Row Level Security limits each user to their own tasks.

## 2. Add GitHub repository secrets

Open:

**Repository → Settings → Secrets and variables → Actions → New repository secret**

Add:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Use a Supabase **publishable key**. A legacy `anon` key also works if placed in the same secret. Never use a secret key or `service_role` key.

GitHub Actions writes these values into `config.js` during deployment. Because GitHub Pages runs in the browser, the deployed publishable key is still publicly inspectable. RLS is what protects the data.

## 3. Deploy

1. Put all files in the root of the GitHub repository.
2. Push to the `main` branch.
3. Open **Settings → Pages**.
4. Set **Source** to **GitHub Actions**.
5. Open the Actions tab and wait for **Deploy Super Important Tasks** to complete.

## Mobile installation

The project is a PWA and includes a manifest, 192px/512px icons, and a service worker.

- Android/Chromium: after the browser determines the site is installable, the app asks on the first user interaction whether to install.
- iPhone/iPad: browsers do not expose the same programmable install prompt. The app gives the user the instruction to use **Share → Add to Home Screen**.
- The prompt is mobile-only and does not alter the page layout.
- Installation requires the HTTPS GitHub Pages URL; it does not work from a local `file://` URL.

## Important behavior

- Tasks are separated by calendar date.
- Dates use the device's local timezone, avoiding UTC day drift.
- Rapid date changes cannot render an older request over the newest date.
- Delete requires confirmation.
- Task text is limited to 200 characters in both HTML and SQL.
- Supabase sessions persist in browser storage. Clearing site data creates a new anonymous identity, so the old tasks will no longer be visible from that browser.
