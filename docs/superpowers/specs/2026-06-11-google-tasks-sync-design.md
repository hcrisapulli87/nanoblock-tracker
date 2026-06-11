# Google Tasks Sync — Design

**Date:** 2026-06-11
**Project:** nanoblock-tracker
**Approved scope:** one-way sync, app → Google Tasks. No Discord involvement.

## Goal

A "Nanoblock Collection" list in Google Tasks, visible in the phone app:
**pending tasks = sets still to buy; completed (crossed-out) tasks = sets owned**, covering
all catalog sets (124 at time of writing). The tracker app is the single source of truth —
phone-side edits are healed back to app state on the next sync. Task titles are
`{setId} — {pokemonName}`; owned tasks carry `Condition: …` (sealed/built/loose) and the
date added in their notes.

## Architecture

New module `src/main/google-tasks-sync.ts`, dependency-free (Node `http` + global `fetch`
+ Electron `shell.openExternal`). No new npm packages.

### Auth

- OAuth client credentials read from `{userData}/google-credentials.json` — a copy of the
  same Google Cloud Desktop client used by the household bot (installed during setup).
- Tokens stored in `{userData}/google-tasks-token.json` (`access_token`, `refresh_token`,
  `expiry`).
- First run: loopback OAuth flow — local `http` server on a random port, browser opened
  via `shell.openExternal`, code exchanged at `oauth2.googleapis.com/token` with
  `access_type=offline&prompt=consent` (guarantees a refresh token). 5-minute timeout if
  the user abandons the sign-in; retried on next sync trigger.
- Subsequent runs: silent refresh-token exchange when the access token is within 60s of
  expiry.
- Same caveat as the bot's tokens: while the Google Cloud app is in Testing mode the
  refresh token dies every 7 days (re-auth = browser reopens on next app launch).

### Sync algorithm (`syncNow`)

1. Find-or-create the task list `Nanoblock Collection` (paginated `tasklists.list`).
2. Fetch all tasks with `showCompleted=true&showHidden=true`, following `nextPageToken`
   (list exceeds the 100-per-page limit).
3. Desired state = CATALOG (from `../shared/catalog`) joined with the live collection
   (read via `getCollection(db)`).
4. Diff by set id parsed from task titles (`{setId} — …`):
   - catalog set with no task → insert (chained `previous` on first bulk run so the list
     lands in catalog order)
   - status mismatch (phone tick vs. app truth, purchases, removals) → patch `status`
   - notes drift → patch `notes`
   - duplicate tasks for one set id → delete extras
   - tasks that don't parse to a catalog id → left untouched (user's own items)
5. Concurrency guard: one sync at a time; a trigger during a running sync queues exactly
   one follow-up.

### Triggers

- App startup (after DB init and window creation — non-blocking, errors logged only)
- After each collection mutation IPC (`ADD_TO_COLLECTION`, `UPDATE_COLLECTION_ENTRY`,
  `REMOVE_FROM_COLLECTION`), debounced 3 seconds.

## Error handling

| Failure | Behaviour |
|---|---|
| No credentials file | Sync disabled, single console warning, app unaffected |
| User abandons first sign-in | 5-min timeout; retried on next trigger/launch |
| Token expired/revoked (weekly Testing-mode death) | Browser sign-in reopens on next launch |
| Network/API error mid-sync | Logged, partial progress kept, next trigger re-diffs (idempotent) |

## Out of scope

- Writing to `collection.db` from the sync (one-way only)
- Discord bot involvement of any kind
- In-app notification UI for phone ticks (future idea Harrison floated)

## Verification

1. `npm run typecheck` (or build) passes.
2. Launch app → browser sign-in → token file appears.
3. Google Tasks app shows "Nanoblock Collection": 64 pending, 60 crossed out, catalog order,
   conditions in notes.
4. Add a set in the tracker → its task crosses out within ~3s.
5. Tick a pending set on the phone → next sync re-opens it (app is truth).
