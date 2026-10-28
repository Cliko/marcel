// Contenu de la semaine 45 (2 au 8 nov 2026). Remplacé chaque dimanche par la génération automatique.
const WEEK = "s45";
const WEEK_LABEL = "Semaine 45 · 2 au 8 nov 2026";
// [nom, conseil, séries débutant, séries intermédiaire, repos, recherche d'images]
const DAYS = [
  { id: "lun", date: "Lun 2 nov", iso: "2026-11-02", title: "Poussée", bonus: 50,
    note: "Échauffement 5 min : rotations d'épaules, poignets, 30 jumping jacks.",
    ex: [
      ["Pompes", "Débutant : sur les genoux ou mains sur un banc. Corps gainé, coudes à 45°.", "4 × 6", "4 × 12", "90 s", "pompes push-up exécution schéma"],
      ["Pike push-ups", "Fesses en l'air, tête qui descend entre les mains. Prépare les épaules.", "3 × 5", "3 × 10", "90 s", "pike push up exercise diagram"],
      ["Dips sur chaise", "Dos près de la chaise, descends jusqu'à 90° aux coudes.", "3 × 6", "3 × 12", "90 s", "dips sur chaise exercice schéma"],
      ["Planche", "Fessiers serrés, bassin neutre.", "3 × 30 s", "3 × 45 s", "60 s", "planche gainage position correcte schéma"],
    ]},
  { id: "mar", date: "Mar 3 nov", iso: "2026-11-03", title: "Tirage + jambes", bonus: 50,
    note: "Tout le tirage se fait au poids du corps, sous une table solide ou avec une serviette.",
    ex: [
      ["Rowing sous une table", "Allongé sous une table solide, mains au bord, tire la poitrine vers le plateau, corps droit.", "4 × 6", "4 × 12", "90 s", "inverted row under table exercise"],
      ["Tirage serviette à la porte", "Serviette autour des deux poignées, porte bien fermée, pieds près de la porte, penche-toi en arrière et tire.", "3 × 10", "3 × 15", "60 s", "door towel row exercise"],
      ["Squats", "Talons au sol, descends sous les genoux si la mobilité le permet.", "4 × 15", "4 × 25", "60 s", "squat poids du corps technique schéma"],
      ["Fentes alternées", "Genou arrière qui frôle le sol.", "3 × 8 /jambe", "3 × 12 /jambe", "60 s", "fentes alternées exercice schéma"],
      ["Superman", "Bras et jambes décollés, tiens 2 s en haut.", "3 × 12", "3 × 15", "45 s", "superman exercice lombaires schéma"],
    ]},
  { id: "mer", date: "Mer 4 nov", iso: "2026-11-04", title: "Sortie vélo de route", bonus: 50,
    note: "Le jour vélo peut glisser sur un autre jour sans séance si la météo l'impose. Garde au moins un jour entre le vélo et la séance jambes du mardi si tu as les cuisses lourdes.",
    ex: [
      ["Vélo de route en endurance", "Allure où tu peux encore parler. Pas de sprint, on construit le fond.", "1 h", "1 h 30 à 2 h", "—", ""],
      ["Mobilité hanches et ischios", "Après la sortie : fente basse, pigeon, étirement ischios, chat-vache.", "10 min", "15 min", "—", "étirements après vélo hanches ischios"],
    ]},
  { id: "jeu", date: "Jeu 5 nov", iso: "2026-11-05", title: "Full body", bonus: 50,
    note: "Échauffement 5 min, puis enchaîne les exercices dans l'ordre.",
    ex: [
      ["Burpees", "Débutant : sans saut, en reculant les pieds un par un.", "3 × 6", "3 × 12", "90 s", "burpee étapes schéma"],
      ["Pompes (intermédiaire : diamant)", "Diamant : mains rapprochées sous la poitrine.", "3 × 8", "3 × 10", "90 s", "diamond push up diagram"],
      ["Squats bulgares", "Pied arrière sur une chaise, buste droit.", "3 × 6 /jambe", "3 × 10 /jambe", "90 s", "squat bulgare poids du corps schéma"],
      ["Hollow hold", "Bas du dos collé au sol, bras tendus derrière la tête.", "3 × 20 s", "3 × 40 s", "60 s", "hollow body hold diagram"],
      ["Pont fessier", "Intermédiaire : sur une jambe.", "3 × 12", "3 × 10 /jambe", "60 s", "pont fessier exercice schéma"],
    ]},
  { id: "ven", date: "Ven 6 nov", iso: "2026-11-06", title: "Tirage + gainage", bonus: 50,
    note: "Séance plus technique : qualité avant quantité.",
    ex: [
      ["Rowing sous une table, pause", "Tiens 2 s en haut, poitrine contre le plateau. Intermédiaire : pieds surélevés sur une chaise.", "4 × 6", "4 × 10", "90 s", "inverted row under table exercise"],
      ["Y-T-W allongé", "À plat ventre, bras en Y, puis T, puis W, pouces vers le ciel. 1 rep = Y + T + W.", "3 × 6", "3 × 10", "60 s", "YTW exercise prone diagram"],
      ["Tuck L-sit", "Mains sur deux chaises ou au sol, genoux ramenés, fesses décollées.", "4 × 10 s", "4 × 20 s", "60 s", "tuck L-sit chairs exercise"],
      ["Planche latérale", "Hanches hautes, corps aligné.", "3 × 20 s /côté", "3 × 40 s /côté", "45 s", "planche latérale gainage schéma"],
      ["Mountain climbers", "Rythme régulier, bassin bas.", "3 × 20", "3 × 40", "45 s", "mountain climbers exercice schéma"],
    ]},
  { id: "sam", date: "Sam 7 nov", iso: "2026-11-07", title: "Défi EMOM 20 min", bonus: 50,
    note: "EMOM : une série au début de chaque minute, tu te reposes le temps qui reste.",
    ex: [
      ["EMOM 20 min", "Minute impaire : pompes. Minute paire : squats. 10 tours de chaque.", "5 pompes / 10 squats", "10 pompes / 20 squats", "reste de la minute", "EMOM workout explained"],
      ["Retour au calme", "Étirements pectoraux, quadriceps, ischios.", "5 min", "5 min", "—", "étirements pectoraux quadriceps ischios schéma"],
    ]},
  { id: "dim", date: "Dim 8 nov", iso: "2026-11-08", title: "Tests + piscine", bonus: 50,
    note: "Les tests d'abord, à froid mais échauffé : une seule série max, en bonne forme, 3 min de repos entre chaque. La piscine plus tard dans la journée sert de récupération.",
    ex: [
      ["Test pompes max", "S'arrête quand la forme casse.", "1 série", "1 série", "3 min", ""],
      ["Test rowing sous table max", "Même hauteur de table que dans la semaine, corps droit jusqu'au bout.", "1 série", "1 série", "3 min", ""],
      ["Test planche max", "Chrono en main.", "1 série", "1 série", "—", ""],
      ["Natation de récupération", "Nage souple, en alternant crawl et dos. Pause au bord dès que tu en as besoin.", "20 min", "30 min", "—", "crawl technique schéma respiration"],
    ]},];

const TRAINING = ["lun", "mar", "jeu", "ven", "sam"];
const imgUrl = q => "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q);
const QUESTS = [
  { id: "assidu", title: "Assidu", desc: "Terminer les 5 séances d'entraînement de la semaine.", xp: 150, auto: () => TRAINING.every(dayDone) },
  { id: "rouleur", title: "Rouleur", desc: "Faire ta sortie vélo de route dans la semaine, au moins 25 km.", xp: 60 },
  { id: "nageur", title: "Double longueur", desc: "Aller une 2e fois à la piscine dans la semaine, 20 min minimum.", xp: 50 },
  { id: "emom", title: "Machine du samedi", desc: "Finir l'EMOM sans rater une seule minute.", xp: 100 },
  { id: "records", title: "Premiers records", desc: "Noter tes 3 records du dimanche.", xp: 80, auto: () => ["push","pull","plank"].every(k => (state.records[k] || "").trim() !== "") },
  { id: "matinal", title: "Lève-tôt", desc: "Faire 2 séances avant 9 h.", xp: 60 },
  { id: "souple", title: "Souplesse", desc: "Ajouter 2 fois 10 min d'étirements, en plus du mercredi.", xp: 60 },
  { id: "forme", title: "Forme parfaite", desc: "Te filmer sur une série de pompes et corriger un défaut.", xp: 50 },
];
// Partie nutrition (contenu préparé avec Ben : perte de poids, suivi léger, batch cooking tous les 3 jours)
const NUTRI = {"semaine": "s45", "dates": "2 au 8 novembre 2026", "objectif": "Perte de poids en mangeant plus sainement, suivi léger (cases à cocher, pas de calories à saisir)", "a_eviter": ["champignons", "concombre", "courgette (à réessayer un jour, pas imposée)", "trop de pâtes"], "regle_assiette": "½ légumes, ¼ protéines, ¼ féculents complets. Une assiette, pas de resservice.", "suivi_quotidien": [{"id": "dejeuner", "label": "Midi Refectory : plat avec légumes + protéines, sans dessert", "xp": 5}, {"id": "diner", "label": "Soir : une part de batch", "xp": 5}, {"id": "collation", "label": "Collation saine (fruit, poignée d'amandes, skyr)", "xp": 5}, {"id": "eau", "label": "Eau : 8 verres", "type": "compteur", "max": 8, "xp": 10, "bonus": "+2 verres les jours de vélo et de piscine"}], "batch_cooking": {"principe": "2 sessions par semaine, 4 parts chacune = les dîners de la semaine (le midi, Ben commande sur Refectory). La 8e part sert de joker (repas du week-end ou soir de flemme).", "sessions": [{"jour": "Dimanche 1 nov", "recette": "Chili con carne léger", "parts": 4, "kcal_part": 480, "proteines_part_g": 38, "temps": "45 min", "ingredients": ["500 g bœuf haché 5 %", "1 boîte et demie haricots rouges", "2 poivrons", "1 oignon", "600 g tomates concassées", "2 carottes râpées", "épices chili, cumin, paprika fumé", "200 g riz complet (cru)"], "etapes": ["Faire revenir l'oignon et le bœuf", "Ajouter poivrons, carottes, épices, tomates", "Mijoter 25 min, ajouter les haricots 5 min avant la fin", "Cuire le riz à part, répartir en 4 boîtes"], "image": "https://www.google.com/search?tbm=isch&q=chili+con+carne+meal+prep", "prix_total_eur": 13, "prix_part_eur": 3.25}, {"jour": "Jeudi 5 nov", "recette": "Curry de poulet coco léger, patate douce et épinards", "parts": 4, "kcal_part": 470, "proteines_part_g": 40, "temps": "40 min", "ingredients": ["600 g blancs de poulet", "2 patates douces", "250 g épinards", "1 oignon, ail, gingembre", "2 c. à s. pâte de curry", "200 ml lait de coco léger", "400 g tomates concassées", "200 g riz basmati (cru)"], "etapes": ["Dorer le poulet en dés, réserver", "Revenir oignon, ail, gingembre, curry", "Ajouter patate douce en cubes, tomates, coco, mijoter 15 min", "Remettre le poulet, ajouter les épinards 2 min", "Servir avec le riz"], "image": "https://www.google.com/search?tbm=isch&q=curry+poulet+patate+douce+epinards", "prix_total_eur": 14.5, "prix_part_eur": 3.6}], "liste_courses": ["bœuf haché 5 % 500 g", "blancs de poulet 600 g", "haricots rouges x2 boîtes", "tomates concassées x3 boîtes", "lait de coco léger 200 ml", "pâte de curry", "riz complet", "riz basmati", "poivrons x2", "oignons x2", "carottes x2", "patates douces x2", "épinards 250 g", "ail, gingembre", "épices chili, cumin, paprika fumé", "skyr ou fromage blanc 0 % x4", "fruits de saison (pommes, clémentines, kiwis)", "amandes"]}, "quetes_nutrition": [{"id": "n_eau", "label": "Hydraté : 8 verres d'eau 5 jours sur 7", "xp": 40}, {"id": "n_batch", "label": "Chef du batch : faire les 2 sessions de la semaine", "xp": 60}, {"id": "n_legumes", "label": "Assiette verte : des légumes midi et soir 5 jours", "xp": 40}, {"id": "n_soda", "label": "Zéro soda ni boisson sucrée de la semaine", "xp": 30}, {"id": "n_grignotage", "label": "Pas de grignotage après le dîner 5 soirs", "xp": 40}, {"id": "n_recup", "label": "Récup' : collation protéinée après vélo et piscine", "xp": 20}, {"id": "n_refectory", "label": "Choix malin : 5 plats Refectory équilibrés, sans dessert ni frites", "xp": 30}], "astuces_marcel": ["Un grand verre d'eau avant chaque repas : on mange moins sans s'en rendre compte.", "Mange lentement, pose la fourchette entre deux bouchées.", "Remplis la moitié de l'assiette de légumes d'abord.", "Sur Refectory, vise un plat avec une protéine maigre et des légumes, et zappe le dessert.", "Sans petit-déj, garde ta collation pour l'après-midi : ça évite d'arriver affamé au dîner.", "Un écart n'efface pas la semaine : reprends au repas suivant.", "Le dimanche, bilan : on garde les recettes que tu as aimées."], "budget": {"principe": "Prix estimés en supermarché (marque distributeur), objectif ≤ 4 € la part", "recettes_semaine_eur": 27.5, "courses_totales_eur": 38, "note": "Courses pour les dîners et les collations. Les déjeuners Refectory ne sont pas comptés."}};
const FOOD_DAILY = NUTRI.suivi_quotidien;
const FOOD_DAY_XP = FOOD_DAILY.reduce((s, f) => s + f.xp, 0);
NUTRI.quetes_nutrition.forEach(q => QUESTS.push({ id: q.id, food: true, title: q.label.split(" : ")[0], desc: q.label.split(" : ").slice(1).join(" : "), xp: q.xp,
  auto: q.id === "n_batch" ? () => NUTRI.batch_cooking.sessions.every((_, i) => state.food.batch[i])
      : q.id === "n_eau" ? () => DAYS.filter(d => (state.food.water[d.id] || 0) >= 8).length >= 5 : undefined }));
function foodItemDone(dayId, f) { return f.type === "compteur" ? (state.food.water[dayId] || 0) >= f.max : !!state.food.daily[dayId + "-" + f.id]; }
function foodDayXp(dayId) { return FOOD_DAILY.reduce((s, f) => s + (foodItemDone(dayId, f) ? f.xp : 0), 0); }
function foodDayDone(dayId) { return FOOD_DAILY.every(f => foodItemDone(dayId, f)); }
const TIERS = [
  { xp: 350, name: "Bronze", reward: "Ton repas plaisir du week-end" },
  { xp: 700, name: "Argent", reward: "Un accessoire : élastiques ou parallettes" },
  { xp: 1050, name: "Or", reward: "Une sortie de ton choix, sans culpabiliser" },
];
const MAX_XP = DAYS.reduce((s, d) => s + d.bonus + FOOD_DAY_XP, 0) + QUESTS.reduce((s, q) => s + q.xp, 0);
