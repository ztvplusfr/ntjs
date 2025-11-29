create extension if not exists "uuid-ossp";

create table if not exists public.history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  content_id text not null,
  content_type text not null check (content_type in ('movie', 'series')),
  season integer,
  episode integer,
  progress_seconds integer default 0,
  duration_seconds integer,
  last_watched_at timestamptz not null default timezone('utc', now()),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists history_user_content_idx on public.history (user_id, content_id);

alter table public.history enable row level security;

-- Exemple de politique pour permettre aux utilisateurs d'accéder uniquement à leurs données
-- create policy "history_select_own" on public.history
--   for select
--   using (auth.uid() = user_id);

-- create policy "history_modify_own" on public.history
--   for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

