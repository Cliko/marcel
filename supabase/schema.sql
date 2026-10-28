-- À lancer une fois dans Supabase > SQL Editor.
-- Une ligne de progression par utilisateur et par semaine (week = "s45", "s46"...).
create table if not exists public.progress (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

alter table public.progress enable row level security;

-- Chacun ne lit et n'écrit que ses propres lignes.
drop policy if exists "progression perso" on public.progress;
create policy "progression perso" on public.progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
