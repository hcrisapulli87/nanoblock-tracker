# Nanoblock Tracker

Track your Pokémon Nanoblock (NBPM) collection. A desktop app (Electron) for browsing the
full catalog and researching prices, plus an installable phone PWA — both backed by the same
**Supabase** database, so marking a set owned on one device shows up on the other in ~1s.

```
 Desktop (Electron)  ─┐                         ┌─ Postgres: public.collection
                      ├─ @supabase/supabase-js ─┤─ Realtime (changes → every client)
 Phone (mobile/ PWA) ─┘                         └─ Auth (email+password) + RLS
```

The static set list (`src/shared/catalog.ts`) is bundled in both apps; Supabase stores only
which sets you own (condition + notes). Data is scoped to your account by Row-Level Security.

---

## 1. Supabase backend (one-time)

1. Create a new project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query →** paste `supabase/schema.sql` and run it.
   - It is idempotent (safe to re-run). The editor flags the `drop policy if exists` lines as
     "destructive" — that's a keyword false-positive; there's no `DROP TABLE`/`DELETE`/`TRUNCATE`
     and no row is removed. Proceed.
3. **Authentication → Users → Add user → Create new user:** enter your email + a password and
   tick **Auto Confirm User**. (Public sign-ups stay disabled; only this user can sign in.)
4. **Project Settings → API:** copy the **Project URL** and the **publishable key**
   (`sb_publishable_…`) for the next steps.

## 2. Desktop app

```bash
npm install
cp .env.example .env     # then fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev              # or: npm start  (electron-vite preview)
```

Sign in with the email + password from step 1. eBay price lookups and the price scraper run in
the Electron main process (desktop-only).

**Automatic migration:** on first launch after upgrading, if your Supabase collection is empty
and a pre-Supabase local `collection.db` exists in the app's userData, the desktop uploads those
rows once. Nothing to re-enter; it never runs again after the cloud has data.

## 3. Phone PWA (`mobile/`)

```bash
cd mobile
npm install
cp .env.example .env     # same URL + publishable key as the desktop
npm run dev
```

Deploy to **Vercel**:
- New Project → import this repo → **Root Directory = `mobile/`**.
- Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- After deploy, open the URL on your phone and **Add to Home Screen** to install it.

On the phone you can search the catalog, toggle sets owned, set condition, and edit notes —
all syncing live with the desktop.

> The phone reuses the desktop's catalog via `mobile/scripts/sync-shared.mjs`, which copies
> `src/shared/{catalog,types}.ts` into `mobile/src/shared/` before each build. That folder is
> gitignored (derived) — edit the catalog in `src/shared/`, never in `mobile/`.

## Develop

```bash
npm run typecheck && npm run test:run   # desktop
cd mobile && npm run build              # phone (typecheck + PWA build)
```

## Notes

- The publishable key is a **public** browser key — safe to ship. Security lives in Postgres
  Row-Level Security, not in hiding the key. Keep the real `.env` gitignored.
- Single-user by design; the `owner_id` column leaves multi-user as a clean future addition.
