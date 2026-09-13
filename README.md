# China QA Control Tower — GitHub Pages + Supabase Production Package

This package upgrades the validated standalone V8 into a **central, versioned web deployment** without running your own server.

## Architecture

- **GitHub Pages**: hosts `index.html` (Viewer Mode) and `admin.html` (Admin Mode).
- **Supabase Auth**: login and Viewer/Admin identity.
- **Supabase Postgres**: central versioned Quality / SCM / Evidence metadata.
- **Supabase Storage**: private evidence binaries.
- **Existing V8 engine**: upload parsing, batch decoding, reconciliation, KPIs and dashboard logic are preserved in the browser.

## Upload behavior

**Quality and SCM are FULL SNAPSHOT / REPLACEMENT by default.** An admin uploads one complete file. The browser parses it, validates it and reconciles it locally. On Publish, the complete current snapshot is written as a **new version**. The existing LIVE version is not modified until Publish succeeds.

Evidence can be appended or replaced in the V8 Admin UI; the final Publish still stores a complete version snapshot.

### Chunking

Admin never splits files manually. If an SCM workbook has 67,000 rows, Admin selects **one workbook**. The application automatically uploads normalized rows to Supabase in chunks (default 1,000 rows/request) with progress and retry-safe boundaries.

## Factory rule locked

- K103 = SMD
- K104 = RCK
- K118 = MJL

The existing V8 reconciliation logic remains the source of truth.

## First setup

Read `docs/STEP_BY_STEP.md` and execute `supabase/schema.sql`.

## Public-repo safety

The deployed `site/` pages have the embedded V8 Quality, SCM, Evidence, thumbnails and historical decode override payloads removed. The first Admin setup therefore requires uploading the current Quality/SCM masters and importing the separately supplied decode-override JSON into Supabase. Do not commit that bootstrap JSON to a public GitHub repository.
