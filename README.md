# Engineering Drawing Kit — Sale & Resale

Static site (`public/`) + Vercel serverless functions (`api/`) + Turso database.
Design: Hand-Drawn Sketch-Note (see design.md).

## Setup (one time)

1. **Turso** — create the table: open your database in the Turso dashboard, go to the SQL console,
   and paste the contents of `schema.sql`. Then copy the database URL and create an auth token.
2. **Vercel** — in Project → Settings → Environment Variables add:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
3. Replace the contents of your GitHub repo with this folder and push. Vercel redeploys automatically
   (Framework preset: **Other**; `vercel.json` already points the output to `public/`).

Local testing (optional): `npm i -g vercel`, add the two variables to `.env.local`, run `vercel dev`.

## How the data works

- Table `kits` has an `active` column (1 = visible, 0 = hidden). Nothing is ever deleted.
- `GET  /api/kits`   → active listings only (search, price sort, paging). Never returns secret codes.
- `POST /api/list`   → new listing (starts active). Secret code is stored as a salted scrypt hash.
- `POST /api/manage` → verifies WhatsApp number + secret code, then hides/shows listings.

## Files

| Path | Purpose |
| --- | --- |
| `public/index.*`  | Listings page (hero, search, sticky-note cards, safety guide) |
| `public/list.*`   | List My Kit form |
| `public/manage.*` | Manage My Kit (replaces delete): hide / show switch |
| `public/shared.*` | Design tokens, paper background, buttons, fields, helpers |
| `public/icons.svg`| Hand-drawn icon sprite |
| `api/`, `lib/`    | Serverless functions + Turso client |
| `schema.sql`      | Table definition |
