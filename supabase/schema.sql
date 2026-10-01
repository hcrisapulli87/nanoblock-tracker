-- Nanoblock Tracker — Supabase schema. Idempotent & safe to re-run.
-- Lives on the shared "H&K Household" project (pxgqfwicnwcwnimeulin) alongside Tandem,
-- Tally, Everafter, etc. — hence the app-prefixed table name. Do NOT touch `profiles`
-- or the project's auth trigger; those belong to the project, not this app.
-- The SQL Editor flags the `drop policy if exists` lines as "destructive"; that is a
-- keyword false-positive — there is no DROP TABLE / DELETE / TRUNCATE and no row is removed.

create table if not exists public.nanoblock_collection (
  set_id     text not null,
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  condition  text not null check (condition in ('sealed','built','loose')),
  notes      text not null default '',
  date_added timestamptz not null default now(),
  primary key (owner_id, set_id)
);

alter table public.nanoblock_collection enable row level security;

drop policy if exists "nanoblock_collection: owner read"   on public.nanoblock_collection;
drop policy if exists "nanoblock_collection: owner insert" on public.nanoblock_collection;
drop policy if exists "nanoblock_collection: owner update" on public.nanoblock_collection;
drop policy if exists "nanoblock_collection: owner delete" on public.nanoblock_collection;

create policy "nanoblock_collection: owner read"
  on public.nanoblock_collection for select using (owner_id = (select auth.uid()));
create policy "nanoblock_collection: owner insert"
  on public.nanoblock_collection for insert with check (owner_id = (select auth.uid()));
create policy "nanoblock_collection: owner update"
  on public.nanoblock_collection for update
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "nanoblock_collection: owner delete"
  on public.nanoblock_collection for delete using (owner_id = (select auth.uid()));

-- Realtime: broadcast row changes to every signed-in client (guarded so re-runs don't error).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nanoblock_collection'
  ) then
    alter publication supabase_realtime add table public.nanoblock_collection;
  end if;
end $$;
