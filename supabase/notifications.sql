-- Notifications push (bilan du samedi, nouvelle semaine). À lancer une fois dans Supabase > SQL Editor, après profils.sql.
-- Relançable sans risque.
--
-- push_abonnements : un abonnement par téléphone (une personne peut en avoir plusieurs)
-- reglages         : clés VAPID créées par `node outils/publier.js push-cles` ; seule la clé publique est lisible par l'appli

create table if not exists public.push_abonnements (
  endpoint text primary key,
  profile_id uuid not null references public.profiles on delete cascade,
  abonnement jsonb not null,
  appareil text,
  created_at timestamptz not null default now()
);

create table if not exists public.reglages (
  cle text primary key,
  valeur text not null
);

alter table public.push_abonnements enable row level security;
alter table public.reglages enable row level security;

-- Chacun gère seulement les abonnements de son profil ; Marcel (clé secrète) lit tout pour envoyer.
drop policy if exists "abonnement lu" on public.push_abonnements;
create policy "abonnement lu" on public.push_abonnements for select to authenticated
  using (profile_id = (select public.mon_profil_id()));
drop policy if exists "abonnement créé" on public.push_abonnements;
create policy "abonnement créé" on public.push_abonnements for insert to authenticated
  with check (profile_id = (select public.mon_profil_id()));
drop policy if exists "abonnement modifié" on public.push_abonnements;
create policy "abonnement modifié" on public.push_abonnements for update to authenticated
  using (profile_id = (select public.mon_profil_id())) with check (profile_id = (select public.mon_profil_id()));
drop policy if exists "abonnement supprimé" on public.push_abonnements;
create policy "abonnement supprimé" on public.push_abonnements for delete to authenticated
  using (profile_id = (select public.mon_profil_id()));

-- La clé privée VAPID n'est lisible qu'avec la clé secrète.
drop policy if exists "clé publique lue" on public.reglages;
create policy "clé publique lue" on public.reglages for select to authenticated
  using (cle = 'vapid_public');

-- Suivi des envois (ajouté le 15/11/2026) : dernière ouverture de l'appli sur ce téléphone, dernier envoi et son résultat
-- (rempli par `publier.js notifier`). L'admin voit l'état des téléphones de chaque profil.
alter table public.push_abonnements add column if not exists vu_le timestamptz;
alter table public.push_abonnements add column if not exists envoi_le timestamptz;
alter table public.push_abonnements add column if not exists envoi_ok boolean;
alter table public.push_abonnements add column if not exists envoi_erreur text;
drop policy if exists "abonnements vus par l'admin" on public.push_abonnements;
create policy "abonnements vus par l'admin" on public.push_abonnements for select to authenticated
  using ((select public.is_admin()));
