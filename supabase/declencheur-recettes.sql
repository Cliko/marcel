-- Recettes d'un nouveau profil : Supabase prévient Marcel dès qu'un profil remplit
-- son questionnaire nutrition pour la PREMIÈRE fois (nutrition_maj passe de vide à rempli).
-- Remplace la vérification de 12 h 17 / 20 h 17 : plus aucun passage quand il n'y a rien à faire.
--
-- À lancer une fois dans Supabase > SQL Editor, après profils.sql.
-- Avant : dans claude.ai/code/routines, tâche « Recettes d'un nouveau profil » > Edit >
-- Trigger + > API > Generate token, puis colle le jeton à la place de COLLE_LE_JETON ci-dessous.
-- Relançable sans risque (le jeton est remplacé s'il existe déjà).

create extension if not exists pg_net with schema extensions;

-- Jeton rangé dans le coffre Supabase (Vault), jamais dans le dépôt.
do $$
declare v uuid;
begin
  select id into v from vault.secrets where name = 'marcel_recettes_token';
  if v is null then
    perform vault.create_secret('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', 'marcel_recettes_token', 'Jeton de la tâche « Recettes d''un nouveau profil »');
  else
    perform vault.update_secret(v, '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');
  end if;
end $$;

create or replace function public.prevenir_marcel_recettes() returns trigger
language plpgsql security definer set search_path = public as $$
declare jeton text;
begin
  if new.actif and new.nutrition_maj is not null
     and (tg_op = 'INSERT' or old.nutrition_maj is null) then
    select decrypted_secret into jeton from vault.decrypted_secrets where name = 'marcel_recettes_token';
    if jeton is not null and jeton <> 'COLLE_LE_JETON' then
      perform net.http_post(
        url := 'https://api.anthropic.com/v1/claude_code/routines/trig_01R4JRDLFpQmYD9HtXBkvgna/fire',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || jeton,
          'anthropic-beta', 'experimental-cc-routine-2026-04-01',
          'anthropic-version', '2023-06-01',
          'Content-Type', 'application/json'),
        body := jsonb_build_object('text', 'profil: ' || new.email)
      );
    end if;
  end if;
  return new;
exception when others then
  -- Un souci d'appel ne doit jamais bloquer l'enregistrement du questionnaire.
  raise warning 'prevenir_marcel_recettes : %', sqlerrm;
  return new;
end $$;

drop trigger if exists prevenir_marcel_recettes on public.profiles;
create trigger prevenir_marcel_recettes after insert or update of nutrition_maj on public.profiles
  for each row execute function public.prevenir_marcel_recettes();

-- Vérifier le dernier appel (status_code 200 = tâche lancée) :
-- select id, status_code, content, created from net._http_response order by created desc limit 5;
