# STEP BY STEP — First Production Deployment

## Phase A — Supabase (one time)

1. Create a Supabase project.
2. Open **SQL Editor** and run the entire `supabase/schema.sql` file.
3. In **Authentication → Users**, create/invite your first user account.
4. Return to SQL Editor and promote your account:

   ```sql
   update public.qa_profiles
   set role='admin'
   where email='your.company@email.com';
   ```

5. Create/invite other users. They remain `viewer` by default.
6. Open the project's **Connect** dialog or **Settings → API Keys** and copy:
   - Project URL
   - Publishable key

   Do **not** use a secret/service-role key in the browser.

## Phase B — Configure the web package

1. Open `site/app-config.js`.
2. Replace:
   - `PASTE_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_SUPABASE_PUBLISHABLE_KEY_HERE`
3. Leave `chunkSize: 1000` initially.
4. `keepVersions: 3` means current LIVE + a small rollback history, helping protect the Supabase Free database quota.

## Phase C — GitHub

1. Create a GitHub repository, e.g. `china-qa-control-tower`.
2. Upload this whole package (including `.github/`, `site/`, `supabase/`, `docs/`).
3. Commit to `main`.
4. In **Settings → Pages**, choose **GitHub Actions** as the source.
5. The included workflow deploys only the `site/` folder.
6. After deployment:
   - Viewer: `https://YOURNAME.github.io/china-qa-control-tower/`
   - Admin: `https://YOURNAME.github.io/china-qa-control-tower/admin.html`

## Phase D — One-time engine bootstrap + first LIVE dataset

1. Open `admin.html` and log in with the Supabase admin account.
2. The production HTML is intentionally **data-free** so GitHub Pages never exposes the embedded company dataset.
3. Click **Import Engine Config** and select the separately supplied local file `China_QA_Decode_Overrides_BOOTSTRAP.json`. Do this once. The historical decode overrides are then stored behind Supabase authentication/RLS, not in GitHub.
4. Go to **Data Upload Center**.
5. Optional: download the built-in Quality / SCM / Evidence templates.
6. Upload the current full Quality master (one file).
7. Upload the current full SCM master (one file; multi-sheet is supported by the existing engine).
8. Upload/append Evidence if needed.
9. Review **Reconciliation Audit** and Data Quality.
10. Return to **Data Upload Center** and click **Publish Current Dataset**.
11. The application automatically:
    - creates a STAGING version,
    - persists evidence binaries where possible,
    - uploads Quality rows in chunks,
    - uploads SCM rows in chunks,
    - uploads Evidence metadata,
    - atomically switches the LIVE pointer,
    - archives the old LIVE version,
    - prunes old archived DB versions according to `keepVersions`.
12. Open Viewer Mode and refresh. Every viewer now reads the same LIVE version.

## Normal monthly / periodic operation

1. Admin opens `admin.html`; it automatically loads the current LIVE version as the working base.
2. Admin uploads a new full Quality master and/or SCM master.
3. The new upload **replaces that dataset locally in Admin staging**; it does not modify LIVE yet.
4. Existing V8 reconciliation runs automatically.
5. Admin validates changes and clicks Publish.
6. All viewers receive the new version on refresh.

## Replacement vs append rules

- **Quality**: Full Replacement / snapshot.
- **SCM**: Full Replacement / snapshot.
- **Evidence**: Append or Replace as selected in the Admin UI.
- **LIVE database**: never overwritten in place. A new version is created; Publish only switches the active pointer.

This means rollback is possible while a retained historical version remains in Supabase.

## Language and period semantics

The V8 ENG / INDO / 中文 behavior is preserved.

- Executive occurrence KPIs/trends: **Quality Issue Date**.
- Quality Issue Ratio: **Production Date**.
- Distributor page: Ratio uses Production Date; Claim/Payment trend uses Quality Issue Date.

## Evidence size

Supabase Free currently caps an individual Storage file at 50 MB. The package stores normalized tabular data in Postgres rather than uploading one giant JSON file. Evidence files over the Storage limit must be compressed/split externally or the project upgraded.

## Security

- `app-config.js` contains only the Supabase Project URL + publishable key. These are expected to be visible in a browser.
- RLS in `schema.sql` is the actual access-control boundary.
- Never put a secret key, service-role key, database password or personal password into GitHub Pages.
- `admin.html` being discoverable is not a security issue by itself: database/storage writes are denied unless the logged-in Supabase user has `role='admin'`.

## Recommended first test

Use `test-data/China_QA_Dummy_Upload_Test_Kit.zip` before publishing real data. The decode-override bootstrap JSON is intentionally **not inside the GitHub package**; keep that file local and never commit it to a public repository. Test in Admin Mode, verify the expected reconciliation result, then either restore/load LIVE or publish only if it is intentionally a test environment.
