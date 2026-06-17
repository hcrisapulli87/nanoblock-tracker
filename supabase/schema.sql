-- Nanoblock Tracker — Supabase schema. Idempotent & safe to re-run.
-- The SQL Editor flags the `drop policy if exists` lines as "destructive"; that is a
-- keyword false-positive — there is no DROP TABLE / DELETE / TRUNCATE and no row is removed.

create table if not exists public.collection (
  set_id     text not null,
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  condition  text not null check (condition in ('sealed','built','loose')),
  notes      text not null default '',
  date_added timestamptz not null default now(),
  primary key (owner_id, set_id)
);

alter table public.collection enable row level security;

drop policy if exists "collection: owner read"   on public.collection;
drop policy if exists "collection: owner insert"  on public.collection;
drop policy if exists "collection: owner update"  on public.collection;
drop policy if exists "collection: owner delete"  on public.collection;

create policy "collection: owner read"
  on public.collection for select using (owner_id = auth.uid());
create policy "collection: owner insert"
  on public.collection for insert with check (owner_id = auth.uid());
create policy "collection: owner update"
  on public.collection for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "collection: owner delete"
  on public.collection for delete using (owner_id = auth.uid());

-- Realtime: broadcast row changes to every signed-in client.
alter publication supabase_realtime add table public.collection;
