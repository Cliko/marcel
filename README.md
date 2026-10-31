# Marcel, coach sport et nutrition

Appli web installable (PWA) : séances de callisthénie, quêtes avec XP, nutrition et batch cooking.
Hébergée sur GitHub Pages : https://cliko.github.io/marcel/

## Fichiers

- `index.html` : structure et styles (bandeau XP, onglets Séance / Quêtes / Nutrition, écran de connexion).
- `data/prochaine.js` : nutrition de la semaine suivante (`NUTRI_NEXT`, même format que `NUTRI`), publiée le vendredi matin pour les courses du week-end ; `null` sinon.
- `data/semaine.js` : **contenu de la semaine** (`WEEK`, `WEEK_LABEL`, `DAYS`, `NUTRI`, `QUESTS`, `TIERS`). C'est le seul fichier à remplacer chaque semaine.
- `js/stockage.js` : connexion Supabase (bouton Connexion = lien envoyé au compte unique `SUPABASE_LOGIN`, session gardée) et sauvegarde de la progression.
- `js/app.js` : rendu et interactions.
- `js/config.js` : URL du projet Supabase et clé publishable.
- `manifest.webmanifest`, `sw.js`, `icons/` : installation sur Android et mode hors ligne.
- `supabase/schema.sql` : table `progress` et règles d'accès (RLS).

## Nouvelle semaine

Vendredi matin : écrire `data/prochaine.js` avec les recettes et la liste de courses de la semaine suivante.
Dimanche soir : reprendre `NUTRI_NEXT` comme `NUTRI` dans `data/semaine.js`, puis remettre `data/prochaine.js` à `null`.


Remplacer `data/semaine.js` en changeant `WEEK` (ex. `"s46"`) : la progression repart de zéro pour la nouvelle semaine,
l'ancienne reste dans la table `progress` (une ligne par semaine).

## Mise en place Supabase (une fois)

1. SQL Editor : lancer `supabase/schema.sql`.
2. Authentication > URL Configuration : Site URL = `https://cliko.github.io/marcel/`.
3. Le compte unique est créé ; désactiver les nouvelles inscriptions (Authentication > Sign In / Providers).
