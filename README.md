# Marcel, coach sport et nutrition

Appli web installable (PWA) : séances de callisthénie, quêtes avec XP, nutrition et batch cooking.
Hébergée sur GitHub Pages : https://cliko.github.io/marcel/

## Profils

Chaque personne a son profil (table `profiles`) : l'admin (Ben) le crée dans l'onglet Profil > Admin avec un prénom et un e-mail,
puis l'invite depuis Supabase (Authentication > Users > Invite user ; les inscriptions restent fermées). La personne reçoit
son lien, et remplit ses questionnaires sport et nutrition à la première ouverture. Ensuite, elle se reconnecte en tapant son e-mail.
Le compte est rattaché au profil par l'e-mail (trigger `lier_profil`) ; une invitation sans profil créé avant est refusée (`verifier_invitation`).
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

### Bilan de la semaine

- Après chaque séance validée, la personne peut dire « Trop facile / Bien / Trop dur » (`progress.data.bilan.avis`).
- Dès le samedi, l'onglet Séance affiche le **bilan** (`js/bilan.js`) : résumé de la semaine, ressenti (forme, douleur, semaine à venir, remarque),
  puis les propositions de Marcel à accepter ou refuser. Réponses dans `progress.data.bilan` :
  `{ avis: {lun: "dur"}, forme: "fatigue", douleur: ["poignets"] (null = pas répondu), semaine: "chargee", remarque: "…", rep: {volume: true, pike: false} }`.
- Le samedi soir, Marcel écrit ses propositions dans le programme de la semaine en cours (`programs.data.bilan`, commande `bilan` de `outils/publier.js`) :
  `{ "intro": "…", "propositions": [{ "id": "volume", "titre": "Augmenter le volume de 10 %", "pourquoi": "…" }], "maj": "…" }`.
  Pour un profil encore en programme de démarrage, la ligne ne contient que `bilan` et l'appli garde le programme de démarrage.
- Le dimanche soir, la génération applique les propositions acceptées et écrit `changements` (liste de phrases) dans le nouveau programme,
  affichés en haut de l'onglet Séance. Quête automatique « Bilan fait » (30 XP) pour chaque profil.

### Notifications

L'onglet Profil (et le bilan) proposent d'activer les notifications sur le téléphone (`js/notifications.js`, `sw.js`).
Marcel prévient quand le bilan du samedi est prêt (le clic ouvre le bilan) et quand la nouvelle semaine est publiée.
Sur Android, ça marche dans Chrome, appli installée ou non ; sur iPhone, seulement une fois l'appli ajoutée à l'écran d'accueil.
Mise en place : lancer `supabase/notifications.sql` (tables `push_abonnements` et `reglages`), puis `node outils/publier.js push-cles`
(crée les clés VAPID ; la clé privée reste dans Supabase, lisible seulement avec la clé secrète). Envoi : `npm install --prefix outils`
puis `node outils/publier.js notifier <email> "<titre>" "<texte>" [url]`.

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
- `js/bilan.js` : bilan de la semaine, avis après chaque séance, changements de la semaine.
- `js/notifications.js` : abonnement aux notifications push.
- `data/refectory.js` : plats Refectory de la semaine, affichés seulement pour un profil avec `options.refectory` (Ben).
- `data/semaine.js`, `data/prochaine.js` : ancien format, gardés pour la migration ; l'appli ne les lit plus.
- `manifest.webmanifest`, `sw.js`, `icons/` : installation sur Android et mode hors ligne.
- `supabase/schema.sql` : table `progress`. `supabase/profils.sql` : profils, programmes, nutrition, règles d'accès. `supabase/notifications.sql` : notifications push.

## Mise en place Supabase (une fois)

1. SQL Editor : lancer `supabase/schema.sql`, puis `supabase/profils.sql` (crée aussi le profil admin de Ben), puis `supabase/notifications.sql`.
2. Authentication > URL Configuration : Site URL = `https://cliko.github.io/marcel/`.
3. Authentication > Sign In / Providers : laisser les inscriptions **fermées**. On invite chaque personne depuis Authentication > Users,
   après avoir créé son profil dans l'appli.
