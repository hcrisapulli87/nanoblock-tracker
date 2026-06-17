# Nanoblock Tracker — Supabase real-time desktop↔phone sync

**Date:** 2026-06-17
**Status:** Approved for implementation
**Supersedes:** `2026-06-05-mobile-companion-design.md` (Cloudflare tunnel + Express) and
`2026-06-11-google-tasks-sync-design.md` (one-way Google Tasks push). Both mechanisms are
**retired** by this design.

## Problem

The tracker is a local Electron + sql.js app. It currently reaches the phone two ways, each a
half-solution:

| Path | Direction | Works when desktop off? | Real-time? | Limitation |
|---|---|---|---|---|
| Google Tasks sync | App → phone (one-way) | ✅ | ❌ debounced push | Phone edits overwritten; flat list |
| Cloudflare tunnel + Express | Phone reads app (read-only) | ❌ needs desktop on + `cloudflared` | ❌ fetch-on-load | Read-only; desktop must run |

Neither is bidirectional *and* available while the desktop is closed. Goal: one hosted source of
truth giving near-real-time updates **both** desktop→phone and phone→desktop.

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Source of truth | **Supabase is the only source.** Desktop needs internet; sql.js, Google Tasks, Express, and the tunnel are removed. |
| Access model | **Single user** (Harrison), one login, across his own devices. |
| Phone scope | **Full read/write** — browse catalog, mark owned/not, set condition, edit notes. |
| Old paths | **Retire both** Google Tasks sync and the Cloudflare tunnel/Express server. |
| Auth | **Email + password** (matches Tandem; fixes iOS home-screen session persistence). |
| Phone app location | **`mobile/` subfolder in the nanoblock-tracker repo** (reuses shared `CATALOG` + `types`). |
| Hosting | Supabase cloud (backend) + Vercel (the `mobile/` PWA) = **$0**. |

## Architecture

```
 Desktop (Electron shell)                          ┌─ Postgres:  public.collection
   React renderer ── @supabase/supabase-js ────────┤
                          (HTTPS + WebSocket)       ├─ Realtime: row changes → every client
 Phone (installable PWA on Vercel)                  │
   React/Vite ──────── @supabase/supabase-js ───────┴─ Auth (single user) + Row-Level Security
```

No server code of ours. Both clients use `@supabase/supabase-js` directly. The full set list
(`CATALOG`) stays bundled as static data in both apps; Supabase stores only the small
`collection` table. Realtime on that one table makes desktop→phone and phone→desktop the same
operation: everyone reads/writes one table; changes fan out in ~1s.

## Data model (Supabase)

```sql
create table public.collection (
  set_id     text not null,
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  condition  text not null check (condition in ('sealed','built','loose')),
  notes      text not null default '',
  date_added timestamptz not null default now(),
  primary key (owner_id, set_id)
);
```

A 1:1 port of the existing `collection` table plus `owner_id`. `date_added` becomes `timestamptz`
(was an ISO date string); the app keeps treating it as a date.

**RLS** (`schema.sql`, idempotent drop-and-recreate, same pattern as Tandem):
- Enable RLS on `collection`.
- One policy: authenticated users may `select / insert / update / delete` rows where
  `owner_id = auth.uid()`. The public key alone cannot read or write any data.

**Realtime:** add `public.collection` to the `supabase_realtime` publication.

## Desktop changes

The Electron **shell stays**; only the data layer changes.

**Renderer** — `useCollection` keeps its exact public interface (`entries`, `ownedIds`,
`addEntry`, `updateEntry`, `removeEntry`) so `App.tsx`, `SetGrid`, `SetDetail`, `SetCard`,
`ProgressBar` are untouched. Internals swap from `window.electronAPI.*` IPC to a shared
`supabase` browser client: initial `select`, `insert`/`update`/`delete` on mutations, and a
Realtime channel subscription that merges remote row changes into state (so the desktop UI
updates live, exactly like the phone).

A small **auth gate** wraps the app: if there is no Supabase session, show an email+password
login; otherwise render the tracker. (Same shape as Tandem's `AuthProvider` + `Login`.)

**Main process** — keep only what needs Node: eBay price lookups (`ebay.ts`), the scraper
(`nanoblock-scraper.ts`), and `shell.openExternal`. Add one migration handler (below).

**Deleted:** `db.ts`, `google-tasks-sync.ts`, `server.ts`, `tunnel.ts`, `mobile-config.ts`,
`MobileAccessPanel.tsx`, the mobile/collection IPC handlers, and the `express`/`cookie-parser`
dependencies + the `resources/server` build asset. `sql.js` is retained **only** for the
one-time migration module.

The `db.run` auto-persist-on-every-write wrapper in `index.ts` is removed with the sql.js
collection store (it was the known sql.js anti-pattern; irrelevant once Postgres is the store).

## One-time migration

Zero manual steps — existing owned sets just appear:

1. **Main** (`migration.ts`): `readLegacyCollection()` opens `userData/collection.db` with sql.js
   if it exists and returns the rows (`[]` otherwise). Exposed via IPC `migration:getLegacyRows`.
2. **Renderer:** after sign-in and the initial `select`, if the remote `collection` is **empty**
   and legacy rows exist, `upsert` them once. Idempotent — on every later launch the remote is
   non-empty, so it never runs again. The legacy `.db` file is left untouched (a harmless backup).

## Phone PWA (`mobile/`)

New Vite + React + TS PWA in the repo's `mobile/` subfolder, deployed to Vercel from that
directory. Reuses the repo's `src/shared/catalog.ts` and `types.ts` (and the
`src/renderer/assets/nanoblock/` images) via relative import / shared copy so the set list cannot
drift from the desktop. Screens:

- **Login** — email + password (`autoComplete` for iOS Keychain).
- **Collection** — catalog grid/list with owned state, progress count; tap a set to toggle owned,
  set condition, edit notes. Writes go to Supabase; Realtime reflects desktop changes live.

eBay prices and the scraper are **desktop-only** (they need the Electron main process) and are out
of scope on the phone. PWA manifest + service worker via `vite-plugin-pwa`; installable to home
screen.

## Configuration & secrets

- Renderer + PWA read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key — safe in
  the browser; security is in RLS). electron-vite exposes these to the renderer via its env
  mechanism; the PWA uses standard `VITE_*`.
- Real `.env` files are gitignored; `.env.example` is committed for both desktop and `mobile/`.

## User steps (hand-off — same split as Tandem / the OAuth flow)

1. Create a **new Supabase project**; run `supabase/schema.sql`; create the single user
   (email + password, **Auto Confirm**) in Authentication → Users.
2. Put the project URL + publishable key into the desktop `.env` and the Vercel env vars.
3. Create a **GitHub repo**, connect **Vercel** with **Root Directory = `mobile/`**, set
   `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

I set up all code, schema, `.env.example`, config, and the migration; Harrison does the
account-bound clicks. Per his ordering rule: **stand up and verify the Supabase tables before
deploying** the PWA.

## Testing

- **Data layer:** unit-test the collection read/mutation helpers against a mocked supabase client
  (owned-set derivation, toggle insert/delete, condition/notes update).
- **Migration:** unit-test `readLegacyCollection()` (rows parsed from a fixture DB; empty when no
  file) and the "upload only when remote empty" guard.
- Remove tests for the deleted modules (`server`, tunnel, mobile-config, google-tasks-sync).
- `npm run typecheck` + `npm run test:run` green.

## Verification (end-to-end)

- Sign in on desktop and phone (same account). Mark a set owned on the phone → desktop reflects it
  within ~1s; toggle on desktop → phone updates. Condition/notes edits propagate both ways.
- **RLS:** with only the anon key and no session, a `select`/`insert` on `collection` is rejected.
- **Migration:** after upgrading, all previously-owned sets appear in Supabase and on both clients,
  with correct condition/notes; relaunching does not duplicate them.
- **PWA:** add-to-home-screen launches full-screen with its own icon.
- Desktop eBay price lookup and scraper still work unchanged.

## Out of scope (v1 / YAGNI)

Phone-side eBay prices/scraper; desktop offline editing; partner/multi-user; push notifications.
The schema (per-user `owner_id`) leaves multi-user as a clean future addition without rework.
