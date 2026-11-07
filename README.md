# Marcel, coach sport et nutrition

Appli web installable (PWA) : séances de callisthénie, quêtes avec XP, nutrition et batch cooking.
Hébergée sur GitHub Pages : https://cliko.github.io/marcel/

## Profils

Chaque personne a son profil (table `profiles`) : l'admin (Ben) le crée dans l'onglet Profil > Admin avec un prénom et un e-mail,
l'appli envoie le lien de connexion, et la personne remplit ses questionnaires sport et nutrition à la première ouverture.
Seules les adresses invitées peuvent se connecter (trigger `verifier_invitation` sur `auth.users`).
Chacun ne voit que ses données ; l'admin voit seulement l'état des profils.

Le contenu de la semaine est propre à chaque profil et vit dans Supabase :

- `programs` (profile_id, week = `"s46"`…, data) : programme sport, écrit le dimanche soir.
- `nutrition` (profile_id, week, data) : recettes et suivi nutrition, écrits le vendredi matin pour la semaine suivante (format de l'ancien `NUTRI`).
- `progress` (user_id, week, data) : ce que la personne coche.

Sans programme pour la semaine (nouveau profil), l'appli construit un programme de démarrage à partir du questionnaire (`js/contenu.js`).
Le dimanche soir, dès que le programme de la semaine suivante est publié, l'appli l'affiche.

### Format d'un programme (`programs.data`)

```js
{
  "label": "Semaine 46 · 9 au 15 nov 2026",
  "days": [ // 7 jours, lundi → dimanche
    { "id": "lun", "date": "Lun 9 nov", "iso": "2026-11-09", "title": "Poussée", "bonus": 50, "cardio": false,
      "note": "Échauffement…",
      // [nom, conseil, séries débutant, séries intermédiaire, repos, recherche d'images]
      "ex": [["Pompes", "Corps gainé…", "4 × 6", "4 × 12", "90 s", "pompes exécution schéma"]] },
    { "id": "mar", "title": "Repos", "bonus": 0, "ex": [], … } // jour de repos : ex vide, bonus 0
  ],
  "training": ["lun", "mar", "jeu"],          // séances comptées par la quête auto "seances" (facultatif)
  "quests": [{ "id": "assidu", "title": "Assidu", "desc": "…", "xp": 150, "auto": "seances" },
             { "id": "records", "title": "Records", "desc": "…", "xp": 80, "auto": "records" },
             { "id": "rouleur", "title": "Rouleur", "desc": "…", "xp": 60 }],
  "records": [{ "id": "push", "label": "Pompes max", "unit": "reps" }],
  "records_note": "…",
  "tiers": [{ "xp": 350, "name": "Bronze", "reward": "…" }, …] // facultatif : sinon 25/50/75 % de l'XP max
}
```

`cardio: true` marque un jour d'endurance (bonus d'eau dans le suivi nutrition).
Le plan B des jours de flemme vient du profil (`options.plan_b` pour la basse de Ben, sinon la réponse au questionnaire).

### Publier (tâches planifiées)

`outils/publier.js` (clé `SUPABASE_SECRET_KEY`) : `profils`, `progression <email> <sXX>`, `programme <email> <sXX> <fichier.json>`,
`nutrition <email> <sXX> <fichier.json>`, `migrer <email>` (convertit les anciens `data/semaine.js` et `data/prochaine.js`).
Le texte des tâches du dimanche et du vendredi est dans `outils/taches-planifiees.md`.

## Fichiers

- `index.html` : structure et styles (bandeau XP, onglets Séance / Quêtes / Nutrition / Profil, écran de connexion, questionnaires).
- `js/config.js` : URL du projet Supabase, clé publishable, `APP_VERSION` (à augmenter quand `js/app.js` change).
- `js/stockage.js` : connexion par e-mail, chargement du profil et de la semaine, sauvegarde de la progression.
- `js/contenu.js` : questions des questionnaires, programme et nutrition de démarrage, installation du contenu pour `js/app.js`.
- `js/profil.js` : questionnaires, onglet Profil, espace admin.
- `js/app.js` : rendu et interactions (chargé une fois le contenu installé).
- `data/refectory.js` : plats Refectory de la semaine, affichés seulement pour un profil avec `options.refectory` (Ben).
- `data/semaine.js`, `data/prochaine.js` : ancien format, gardés pour la migration ; l'appli ne les lit plus.
- `manifest.webmanifest`, `sw.js`, `icons/` : installation sur Android et mode hors ligne.
- `supabase/schema.sql` : table `progress`. `supabase/profils.sql` : profils, programmes, nutrition, règles d'accès.

## Mise en place Supabase (une fois)

1. SQL Editor : lancer `supabase/schema.sql`, puis `supabase/profils.sql` (crée aussi le profil admin de Ben).
2. Authentication > URL Configuration : Site URL = `https://cliko.github.io/marcel/`.
3. Authentication > Sign In / Providers : **autoriser les inscriptions** (« Allow new users to sign up »). Seules les adresses
   ajoutées dans `profiles` passent : le trigger `verifier_invitation` refuse les autres.
