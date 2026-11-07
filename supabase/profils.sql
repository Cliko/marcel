-- Profils multi-utilisateurs. À lancer une fois dans Supabase > SQL Editor, après schema.sql.
-- Relançable sans risque (create if not exists, create or replace, drop policy if exists).
--
-- profiles  : une ligne par personne invitée par l'admin (prénom, e-mail, rôle, réponses aux questionnaires)
-- programs  : programme sport d'une personne pour une semaine (écrit par Marcel avec la clé secrète)
-- nutrition : recettes et suivi nutrition d'une personne pour une semaine (écrit par Marcel avec la clé secrète)
-- progress  : inchangée (cases cochées par la personne, une ligne par semaine)

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,
  email text not null unique check (email = lower(trim(email))),
  prenom text not null,
  role text not null default 'membre' check (role in ('admin', 'membre')),
  actif boolean not null default true,
  sport jsonb,              -- réponses au questionnaire sport (null = pas encore rempli)
  nutrition jsonb,          -- réponses au questionnaire nutrition (null = pas encore rempli)
  options jsonb not null default '{}'::jsonb,  -- réglages réservés à un profil (ex. Refectory, plan B basse) : modifiables par l'admin seulement
  sport_maj timestamptz,
  nutrition_maj timestamptz,
  lien_envoye_le timestamptz,
  vu_le timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  profile_id uuid not null references public.profiles on delete cascade,
  week text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, week)
);

create table if not exists public.nutrition (
  profile_id uuid not null references public.profiles on delete cascade,
  week text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, week)
);

-- L'utilisateur connecté est-il admin ? (security definer : évite la récursion des règles RLS)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin' and actif);
$$;

-- Profil de l'utilisateur connecté
create or replace function public.mon_profil_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() and actif;
$$;

-- Connexion réservée aux invités : un e-mail absent de profiles (ou désactivé) ne peut pas créer de compte.
create or replace function public.verifier_invitation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where email = lower(new.email) and actif) then
    raise exception 'adresse non invitée';
  end if;
  return new;
end $$;
drop trigger if exists verifier_invitation on auth.users;
create trigger verifier_invitation before insert on auth.users
  for each row execute function public.verifier_invitation();

-- Le compte créé est rattaché à son profil.
create or replace function public.lier_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set user_id = new.id where email = lower(new.email) and user_id is null;
  return new;
end $$;
drop trigger if exists lier_profil on auth.users;
create trigger lier_profil after insert on auth.users
  for each row execute function public.lier_profil();

-- Un membre ne peut modifier que ses réponses (pas son rôle, son e-mail, son statut ni ses options).
create or replace function public.proteger_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- La clé secrète (Marcel) et l'éditeur SQL ne passent pas par ce contrôle.
  if coalesce(auth.jwt() ->> 'role', '') = 'authenticated' and not public.is_admin() then
    new.role := old.role; new.actif := old.actif; new.email := old.email;
    new.user_id := old.user_id; new.options := old.options; new.lien_envoye_le := old.lien_envoye_le;
  end if;
  return new;
end $$;
drop trigger if exists proteger_profil on public.profiles;
create trigger proteger_profil before update on public.profiles
  for each row execute function public.proteger_profil();

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.nutrition enable row level security;

drop policy if exists "profil lu" on public.profiles;
create policy "profil lu" on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profil modifié" on public.profiles;
create policy "profil modifié" on public.profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profil créé par l'admin" on public.profiles;
create policy "profil créé par l'admin" on public.profiles for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "profil supprimé par l'admin" on public.profiles;
create policy "profil supprimé par l'admin" on public.profiles for delete to authenticated
  using ((select public.is_admin()) and user_id is distinct from (select auth.uid()));

-- Programmes et nutrition : chacun ne lit que les siens ; seule la clé secrète (Marcel) écrit.
drop policy if exists "programme perso" on public.programs;
create policy "programme perso" on public.programs for select to authenticated
  using (profile_id = (select public.mon_profil_id()));
drop policy if exists "nutrition perso" on public.nutrition;
create policy "nutrition perso" on public.nutrition for select to authenticated
  using (profile_id = (select public.mon_profil_id()));

-- Ton compte actuel devient le profil admin (préférences reprises de l'appli actuelle).
insert into public.profiles (user_id, email, prenom, role, options, sport, nutrition, sport_maj, nutrition_maj, vu_le)
select u.id, lower(u.email), 'Ben', 'admin',
  '{"refectory": true, "plan_b": {"label": "Session de basse énergique", "court": "Basse", "options": [{"min": 45, "label": "45 min", "kcal": 450}, {"min": 60, "label": "1 h", "kcal": 520}, {"min": 90, "label": "1 h 30 et +", "kcal": 600}]}}'::jsonb,
  '{"objectif": "perte_poids", "niveau": "intermediaire", "jours": ["lun","mar","mer","jeu","ven","sam","dim"], "duree": 45, "envies": ["callisthenie","velo","natation"], "pas_envie": [], "materiel": ["rien","piscine","velo"], "fixes": [{"activite": "Vélo de route", "jour": "mer"}], "zones": [], "plan_b": "", "remarques": "Poids du corps uniquement, pas de barre de traction. Tirage sous une table ou à la serviette."}'::jsonb,
  '{"objectif": "perte_poids", "regime": "omnivore", "allergies": [], "evites": "champignons, concombre, courgette (bof, à réessayer), trop de pâtes", "repas": ["soir"], "midi": "cantine", "recettes": 3, "parts": 4, "budget": 4, "temps": 45, "collations": "non", "suivi": ["eau","repas","defis"]}'::jsonb,
  now(), now(), now()
from auth.users u where lower(u.email) = 'clikoben@gmail.com'
on conflict (email) do update set user_id = excluded.user_id, role = 'admin', actif = true,
  options = excluded.options,
  sport = coalesce(public.profiles.sport, excluded.sport), nutrition = coalesce(public.profiles.nutrition, excluded.nutrition),
  sport_maj = coalesce(public.profiles.sport_maj, excluded.sport_maj), nutrition_maj = coalesce(public.profiles.nutrition_maj, excluded.nutrition_maj);
