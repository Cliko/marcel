-- Retire le déclencheur « recettes d'un nouveau profil » (essai du 17/11/2026, abandonné :
-- une tâche créée dans un projet Claude refuse les appels extérieurs, « this project is paused »).
-- À lancer une fois dans Supabase > SQL Editor. Relançable sans risque.
drop trigger if exists prevenir_marcel_recettes on public.profiles;
drop function if exists public.prevenir_marcel_recettes();
delete from vault.secrets where name = 'marcel_recettes_token';
