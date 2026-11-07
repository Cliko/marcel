// Contenu propre à chaque profil : questionnaires, programme de démarrage et installation du contenu de la semaine.
// Le programme complet est écrit chaque dimanche par Marcel dans la table programs (et les recettes le vendredi dans nutrition).
// Tant qu'il n'y en a pas pour la semaine (nouveau profil), l'appli construit ici un programme de démarrage à partir du questionnaire.

const JOURS = [["lun", "Lun"], ["mar", "Mar"], ["mer", "Mer"], ["jeu", "Jeu"], ["ven", "Ven"], ["sam", "Sam"], ["dim", "Dim"]];
const imgUrl = q => "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q);

// Questionnaires : one = un seul choix, many = plusieurs, days = jours de la semaine, text = texte libre, fixes = activité + jour
const Q_SPORT = [
  { id: "objectif", label: "Ton objectif principal", type: "one", options: [["perte_poids", "Perdre du poids"], ["force", "Prendre de la force"], ["endurance", "Endurance"], ["bien_etre", "Bien-être et mobilité"], ["reprise", "Reprendre en douceur"]] },
  { id: "niveau", label: "Ton niveau", type: "one", options: [["debutant", "Débutant"], ["intermediaire", "Intermédiaire"], ["confirme", "Confirmé"]] },
  { id: "jours", label: "Les jours où tu peux faire du sport", type: "days" },
  { id: "seances", label: "Séances par semaine", type: "one", options: [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]] },
  { id: "duree", label: "Durée d'une séance", type: "one", options: [[15, "15 min"], [20, "20 min"], [30, "30 min"], [45, "45 min"], [60, "1 h"]] },
  { id: "envies", label: "Ce que tu as envie de faire", type: "many", options: [["callisthenie", "Callisthénie"], ["renfo", "Renfo"], ["hiit", "HIIT"], ["course", "Course"], ["velo", "Vélo"], ["natation", "Natation"], ["yoga", "Yoga et mobilité"], ["marche", "Marche"], ["danse", "Danse"]] },
  { id: "pas_envie", label: "Ce que tu n'aimes pas", type: "many", options: [["callisthenie", "Callisthénie"], ["renfo", "Renfo"], ["hiit", "HIIT"], ["course", "Course"], ["velo", "Vélo"], ["natation", "Natation"], ["yoga", "Yoga et mobilité"], ["sauts", "Sauts"]] },
  { id: "materiel", label: "Ton matériel et tes lieux", type: "many", options: [["rien", "Rien"], ["elastiques", "Élastiques"], ["halteres", "Haltères"], ["barre", "Barre de traction"], ["tapis", "Tapis"], ["piscine", "Piscine"], ["velo", "Vélo"], ["salle", "Salle de sport"]] },
  { id: "fixes", label: "Une activité fixe dans la semaine ? (ex. foot le jeudi)", type: "fixes" },
  { id: "zones", label: "Des zones à ménager ?", type: "many", options: [["genoux", "Genoux"], ["dos", "Dos"], ["epaules", "Épaules"], ["poignets", "Poignets"], ["chevilles", "Chevilles"]] },
  { id: "plan_b", label: "Ton plan B les jours de flemme (facultatif)", type: "text", placeholder: "ex. 30 min de marche rapide" },
  { id: "remarques", label: "Autre chose à savoir ?", type: "text", placeholder: "Blessure, contrainte, envie particulière…" },
];
const ALLERGENES = [["gluten", "Gluten"], ["lait", "Lait"], ["lactose", "Lactose"], ["oeufs", "Œufs"], ["arachides", "Arachides"], ["fruits_coque", "Fruits à coque"], ["soja", "Soja"], ["poisson", "Poisson"], ["crustaces", "Crustacés"], ["mollusques", "Mollusques"], ["sesame", "Sésame"], ["celeri", "Céleri"], ["moutarde", "Moutarde"], ["sulfites", "Sulfites"], ["lupin", "Lupin"]];
const Q_NUTRI = [
  { id: "objectif", label: "Ton objectif", type: "one", options: [["perte_poids", "Perdre du poids"], ["maintien", "Maintenir"], ["muscle", "Prendre du muscle"], ["plus_sain", "Manger plus sain"]] },
  { id: "regime", label: "Ton régime", type: "one", options: [["omnivore", "Omnivore"], ["flexitarien", "Flexitarien"], ["pescetarien", "Pescétarien"], ["vegetarien", "Végétarien"], ["vegan", "Végan"], ["sans_porc", "Sans porc"], ["halal", "Halal"]] },
  { id: "allergies", label: "Allergies et intolérances", type: "many", options: ALLERGENES },
  { id: "allergies_autres", label: "Autre allergie ?", type: "text", placeholder: "Facultatif" },
  { id: "evites", label: "Les aliments que tu évites", type: "text", placeholder: "ex. champignons, poivron, coriandre" },
  { id: "repas", label: "Les repas à prévoir", type: "many", options: [["petit_dej", "Petit-déj"], ["midi", "Midi"], ["soir", "Soir"]] },
  { id: "midi", label: "Le midi, d'habitude", type: "one", options: [["cantine", "Cantine ou resto"], ["maison", "Fait maison"], ["variable", "Ça dépend"]] },
  { id: "recettes", label: "Recettes de batch par semaine", type: "one", options: [[1, "1"], [2, "2"], [3, "3"], [4, "4"]] },
  { id: "parts", label: "Parts par recette", type: "one", options: [[2, "2"], [4, "4"], [6, "6"]] },
  { id: "budget", label: "Budget max par part", type: "one", options: [[3, "3 €"], [4, "4 €"], [5, "5 €"], [6, "6 €"]] },
  { id: "temps", label: "Temps de cuisine max", type: "one", options: [[20, "20 min"], [30, "30 min"], [45, "45 min"], [60, "1 h"]] },
  { id: "collations", label: "Des idées de collations ou desserts ?", type: "one", options: [["oui", "Oui"], ["non", "Non"]] },
  { id: "suivi", label: "Ce que tu veux suivre chaque jour", type: "many", options: [["eau", "Eau"], ["repas", "Mes repas"], ["defis", "Défis (sans alcool, sans fast food…)"]] },
];
const Q_REQUIS = { sport: ["objectif", "niveau", "jours", "seances", "duree"], nutrition: ["objectif", "regime", "repas"] };

// Bibliothèque pour le programme de démarrage : [nom, conseil, séries débutant, séries intermédiaire, repos, recherche d'images]
// besoin = matériel nécessaire (absent = poids du corps), evite = zones sollicitées, sauts = exercice avec impacts
const EXOS = {
  pousse: [
    { e: ["Pompes", "Débutant : sur les genoux ou mains sur un banc. Corps gainé, coudes à 45°.", "3 × 6", "4 × 12", "90 s", "pompes exécution schéma"], evite: ["poignets", "epaules"] },
    { e: ["Pike push-ups", "Fesses en l'air, la tête descend entre les mains.", "3 × 5", "3 × 10", "90 s", "pike push up exercise"], evite: ["epaules", "poignets"] },
    { e: ["Dips sur chaise", "Dos près de la chaise, descends jusqu'à 90° aux coudes.", "3 × 6", "3 × 12", "90 s", "dips sur chaise exercice"], evite: ["epaules"] },
    { e: ["Développé haltères au sol", "Allongé, pousse les haltères au-dessus de la poitrine.", "3 × 10", "4 × 12", "90 s", "floor press haltères"], besoin: "halteres" },
    { e: ["Pompes murales", "Mains au mur, corps droit. Version douce pour les poignets.", "3 × 10", "3 × 15", "60 s", "wall push up"] },
  ],
  tire: [
    { e: ["Tractions", "Prise pronation, menton au-dessus de la barre. Débutant : négatives de 5 s.", "4 × 3", "4 × 8", "2 min", "tractions exécution"], besoin: "barre", evite: ["epaules"] },
    { e: ["Rowing sous une table", "Allongé sous une table solide, tire la poitrine vers le plateau, corps droit.", "3 × 6", "4 × 12", "90 s", "inverted row under table"] },
    { e: ["Tirage serviette à la porte", "Serviette autour de la poignée, penche-toi en arrière et tire.", "3 × 8", "4 × 12", "90 s", "door towel row exercise"] },
    { e: ["Rowing élastique", "Élastique fixé devant toi, tire les coudes vers l'arrière.", "3 × 12", "4 × 15", "60 s", "rowing élastique"], besoin: "elastiques" },
    { e: ["Rowing haltère", "Une main sur un banc, tire l'haltère vers la hanche.", "3 × 10", "4 × 12", "90 s", "rowing haltère un bras"], besoin: "halteres", evite: ["dos"] },
    { e: ["Y-T-W au sol", "À plat ventre, lève les bras en Y, T puis W, omoplates serrées.", "3 × 6", "3 × 10", "60 s", "YTW exercise prone"] },
  ],
  jambes: [
    { e: ["Squats", "Pieds largeur d'épaules, descends cuisses parallèles, dos droit.", "3 × 12", "4 × 20", "60 s", "squat exécution schéma"], evite: ["genoux"] },
    { e: ["Fentes alternées", "Grand pas en avant, genou arrière proche du sol.", "3 × 8/jambe", "3 × 12/jambe", "60 s", "fentes avant exercice"], evite: ["genoux"] },
    { e: ["Pont fessier", "Allongé, pieds au sol, monte le bassin en serrant les fessiers.", "3 × 12", "4 × 20", "60 s", "pont fessier exercice"] },
    { e: ["Chaise au mur", "Dos au mur, cuisses parallèles au sol.", "3 × 30 s", "3 × 60 s", "60 s", "wall sit exercise"], evite: ["genoux"] },
    { e: ["Goblet squat", "Un haltère contre la poitrine, descends en gardant le buste droit.", "3 × 10", "4 × 12", "90 s", "goblet squat"], besoin: "halteres", evite: ["genoux"] },
    { e: ["Montées de mollets", "Sur une marche, monte sur la pointe des pieds lentement.", "3 × 15", "3 × 25", "45 s", "calf raises"], evite: ["chevilles"] },
  ],
  gainage: [
    { e: ["Planche", "Fessiers serrés, bassin neutre.", "3 × 20 s", "3 × 45 s", "60 s", "planche gainage position correcte"], evite: ["epaules"] },
    { e: ["Gainage latéral", "Sur un coude, corps aligné.", "2 × 20 s/côté", "3 × 30 s/côté", "45 s", "side plank"], evite: ["epaules"] },
    { e: ["Dead bug", "Sur le dos, bras et jambe opposés descendent sans creuser le dos.", "3 × 8", "3 × 12", "45 s", "dead bug exercise"] },
    { e: ["Bird dog", "À quatre pattes, tends bras et jambe opposés.", "3 × 8/côté", "3 × 12/côté", "45 s", "bird dog exercise"] },
  ],
  cardio: [
    { e: ["Jumping jacks", "Rythme régulier, atterris en douceur.", "3 × 30 s", "4 × 45 s", "30 s", "jumping jacks"], sauts: true, evite: ["genoux", "chevilles"] },
    { e: ["Mountain climbers", "En planche, ramène les genoux vers la poitrine.", "3 × 20 s", "4 × 40 s", "30 s", "mountain climbers"], evite: ["poignets"] },
    { e: ["Burpees", "Débutant : sans saut ni pompe.", "3 × 5", "4 × 10", "60 s", "burpee exécution"], sauts: true, evite: ["genoux", "poignets"] },
    { e: ["Montées de genoux sur place", "Genoux à hauteur de hanche, bras actifs.", "3 × 30 s", "4 × 45 s", "30 s", "high knees"], evite: ["genoux"] },
    { e: ["Shadow boxing", "Enchaîne directs et crochets, reste sur la pointe des pieds.", "3 × 45 s", "4 × 60 s", "30 s", "shadow boxing"] },
  ],
  mobilite: [
    { e: ["Chat-vache", "À quatre pattes, enroule puis creuse le dos lentement.", "1 × 10", "1 × 15", "—", "cat cow stretch"] },
    { e: ["Fente basse étirement", "Genou au sol, avance le bassin pour étirer la hanche.", "1 × 45 s/côté", "1 × 60 s/côté", "—", "low lunge stretch"] },
    { e: ["Posture de l'enfant", "Fesses sur les talons, bras devant, respire.", "1 × 60 s", "1 × 90 s", "—", "child pose yoga"] },
    { e: ["Rotations thoraciques", "Allongé sur le côté, ouvre le bras vers l'arrière.", "1 × 8/côté", "1 × 12/côté", "—", "thoracic rotation stretch"] },
    { e: ["Chien tête en bas", "Mains et pieds au sol, pousse les hanches vers le haut.", "3 × 30 s", "3 × 45 s", "30 s", "downward dog"], evite: ["poignets"] },
  ],
};
// Activités d'endurance : conseil + nom de recherche d'images ; la durée vient du questionnaire
const ACTIVITES = {
  course: ["Course à pied", "Allure où tu peux parler. Débutant : alterne 2 min de course et 1 min de marche.", "course à pied posture"],
  velo: ["Sortie vélo", "Allure régulière, bois souvent.", "sortie vélo endurance"],
  natation: ["Natation", "Nage continue, alterne crawl et brasse. Pause au bord si besoin.", "natation crawl technique"],
  marche: ["Marche rapide", "Pas rapide, bras actifs, tu dois être un peu essoufflé.", "marche rapide technique"],
  danse: ["Danse", "Une playlist que tu aimes, bouge sans t'arrêter.", "cardio dance workout"],
  yoga: ["Yoga", "Une séance guidée douce, respire profondément.", "yoga débutant enchaînement"],
};

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - y0) / 86400000 + 1) / 7);
}
function lundiDe(date) { const d = new Date(date); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
function semaineId(date) { return "s" + isoWeek(date); }
const isoDate = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function labelSemaine(lundi) {
  const dim = new Date(lundi); dim.setDate(dim.getDate() + 6);
  const f = (d, m) => d.toLocaleDateString("fr-FR", m ? { day: "numeric", month: "short" } : { day: "numeric" }).replace(".", "");
  return `Semaine ${isoWeek(lundi)} · ${f(lundi, lundi.getMonth() !== dim.getMonth())} au ${f(dim, true)} ${dim.getFullYear()}`;
}

// Programme de démarrage, construit dans le navigateur à partir du questionnaire sport
function programmeDemarrage(sport, today) {
  const s = sport || {}, lundi = lundiDe(today || new Date());
  const zones = s.zones || [], mat = s.materiel || [], non = s.pas_envie || [];
  const envies = (s.envies || []).filter(e => !non.includes(e));
  const nb = { 15: 3, 20: 3, 30: 4, 45: 5, 60: 6 }[s.duree] || 4;
  const ok = x => (!x.besoin || mat.includes(x.besoin) || mat.includes("salle")) && !(x.evite || []).some(z => zones.includes(z)) && !(x.sauts && non.includes("sauts"));
  const pioche = (fam, n, k) => { const l = EXOS[fam].filter(ok).sort((a, b) => !!b.besoin - !!a.besoin); return Array.from({ length: Math.min(n, l.length) }, (_, i) => l[(i + k) % l.length].e); };
  const force = envies.some(e => ["callisthenie", "renfo"].includes(e)) || !envies.length;
  const endu = envies.filter(e => ACTIVITES[e] && e !== "yoga" && (e !== "natation" || mat.includes("piscine")) && (e !== "velo" || mat.includes("velo") || mat.includes("salle")));
  // Alterne renforcement et le reste (cardio aimé, circuit, mobilité) pour que chaque envie apparaisse même avec peu de séances
  const renfo = force ? ["haut", "bas", "full"] : [], autres = endu.map(e => "endu:" + e);
  if (envies.includes("hiit") || s.objectif === "perte_poids") autres.splice(1, 0, "circuit");
  if (envies.includes("yoga") || s.objectif === "bien_etre") autres.push("mobilite");
  const types = [];
  for (let i = 0; i < Math.max(renfo.length, autres.length); i++) { if (renfo[i]) types.push(renfo[i]); if (autres[i]) types.push(autres[i]); }
  if (!types.length) types.push("full");

  const dispo = JOURS.map(j => j[0]).filter(id => (s.jours || []).includes(id));
  const fixes = (s.fixes || []).filter(f => f.activite && f.jour);
  const libres = dispo.filter(id => !fixes.some(f => f.jour === id));
  const voulu = Math.max(1, Math.min(libres.length, (+s.seances || 3) - fixes.length));
  // Répartit les séances sur les jours libres le plus régulièrement possible
  const choisis = Array.from({ length: voulu }, (_, i) => libres[Math.floor(i * libres.length / voulu)]);
  let k = 0;
  const days = JOURS.map(([id, court], i) => {
    const d = new Date(lundi); d.setDate(d.getDate() + i);
    const base = { id, date: court + " " + d.getDate() + " " + d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""), iso: isoDate(d) };
    const fixe = fixes.find(f => f.jour === id);
    if (fixe) return { ...base, title: fixe.activite, bonus: 50, cardio: true, note: "Ton activité de la semaine. Coche-la une fois faite.", ex: [[fixe.activite, "À ton rythme, profite.", "1 séance", "1 séance", "—", fixe.activite]] };
    if (!choisis.includes(id)) return { ...base, title: "Repos", bonus: 0, note: "Récupération : marche, étirements légers si tu en as envie.", ex: [] };
    const t = types[k % types.length], n = k++;
    if (t.startsWith("endu:")) {
      const a = ACTIVITES[t.slice(5)], min = Math.max(20, s.duree || 30);
      return { ...base, title: a[0], bonus: 50, cardio: true, note: "Échauffement 5 min à allure douce.", ex: [[a[0], a[1], Math.round(min * 0.75) + " min", min + " min", "—", a[2]], ...pioche("mobilite", 1, n)] };
    }
    const plan = {
      haut: ["Haut du corps", [["pousse", Math.ceil(nb / 2)], ["tire", Math.floor(nb / 2)]]],
      bas: ["Jambes et gainage", [["jambes", Math.ceil(nb / 2)], ["gainage", Math.floor(nb / 2)]]],
      full: ["Full body", [["pousse", 1], ["tire", 1], ["jambes", Math.max(1, nb - 3)], ["gainage", 1]]],
      circuit: ["Circuit cardio", [["cardio", Math.ceil(nb / 2)], ["jambes", 1], ["gainage", Math.max(1, Math.floor(nb / 2) - 1)]]],
      mobilite: ["Mobilité", [["mobilite", nb]]],
    }[t];
    const ex = plan[1].flatMap(([fam, q]) => pioche(fam, q, n));
    const note = t === "circuit" ? "Enchaîne les exercices sans pause, repos en fin de tour." : "Échauffement 5 min : rotations d'épaules, poignets, chevilles, 30 jumping jacks ou marche sur place.";
    return { ...base, title: plan[0], bonus: 50, note, ex: ex.length ? ex : pioche("mobilite", 3, n) };
  });
  const training = days.filter(d => d.ex.length).map(d => d.id);
  const quests = [
    { id: "assidu", title: "Assidu", desc: `Terminer tes ${training.length} séances de la semaine.`, xp: 150, auto: "seances" },
    { id: "records", title: "Premiers records", desc: "Noter tes 3 records en fin de semaine.", xp: 80, auto: "records" },
    { id: "souple", title: "Souplesse", desc: "Ajouter 2 fois 10 min d'étirements.", xp: 60 },
    { id: "pas", title: "Bouger plus", desc: "Faire 8 000 pas 4 jours dans la semaine.", xp: 60 },
    { id: "forme", title: "Forme parfaite", desc: "Te filmer sur un exercice et corriger un défaut.", xp: 50 },
  ];
  return { label: labelSemaine(lundi), demarrage: true, days, training, quests,
    records: [{ id: "push", label: "Pompes max", unit: "reps" }, { id: "squat", label: "Squats en 1 min", unit: "reps" }, { id: "plank", label: "Planche max", unit: "sec" }],
    records_note: "Note tes records le dimanche : ils servent à calibrer la semaine suivante.",
    niveau: s.niveau };
}

// Nutrition tant que Marcel n'a pas publié de recettes : suivi du quotidien seulement
function nutritionDemarrage(n) {
  const r = (n && n.repas) || ["midi", "soir"], suivi = (n && n.suivi) || ["eau", "repas"];
  const daily = [];
  if (suivi.includes("repas")) {
    if (r.includes("petit_dej")) daily.push({ id: "matin", label: "Petit-déj", type: "repas", xp: 5, options: [{ id: "maison", label: "Fait maison" }, { id: "ext", label: "Extérieur", sain: false }] });
    if (r.includes("midi")) daily.push({ id: "midi", label: "Midi", type: "repas", xp: 5, options: [{ id: "cantine", label: "Cantine ou resto" }, { id: "batch", label: "Part de batch" }, { id: "maison", label: "Fait maison" }, { id: "ext", label: "Fast food", sain: false }] });
    if (r.includes("soir")) daily.push({ id: "soir", label: "Soir", type: "repas", xp: 5, options: [{ id: "batch", label: "Part de batch" }, { id: "maison", label: "Fait maison" }, { id: "ext", label: "Extérieur", sain: false }] });
  }
  if (suivi.includes("eau")) daily.push({ id: "eau", label: "Eau : 8 verres", type: "compteur", max: 8, xp: 10, bonus: "+2 verres les jours de sport" });
  const quetes = suivi.includes("defis") ? [
    { id: "n_soda", label: "Zéro soda ni boisson sucrée de la semaine", xp: 30 },
    { id: "n_fastfood", label: "Fait maison : aucune livraison ni fast food de la semaine", xp: 50 },
    { id: "n_alcool", label: "Semaine sans alcool", xp: 50 },
  ] : [];
  if (suivi.includes("eau")) quetes.unshift({ id: "n_eau", label: "Hydraté : 8 verres d'eau 5 jours sur 7", xp: 40 });
  return { demarrage: true, regle_assiette: "½ légumes, ¼ protéines, ¼ féculents complets.", suivi_quotidien: daily,
    batch_cooking: { principe: "Tes premières recettes arrivent vendredi matin, avec la liste de courses pour le week-end.", sessions: [] },
    quetes_nutrition: quetes,
    astuces_marcel: ["Un grand verre d'eau avant chaque repas.", "Mange lentement, pose la fourchette entre deux bouchées.", "Remplis la moitié de l'assiette de légumes d'abord.", "Un écart n'efface pas la semaine : reprends au repas suivant."] };
}

// Paliers : un quart, la moitié et trois quarts de l'XP de la semaine, pour qu'ils restent atteignables quel que soit le rythme
function paliersPour(max) {
  const r = x => Math.round(max * x / 10) * 10;
  return [{ xp: r(0.25), name: "Bronze", reward: "Un petit plaisir de ton choix" }, { xp: r(0.5), name: "Argent", reward: "Un accessoire de sport" }, { xp: r(0.75), name: "Or", reward: "Une sortie de ton choix, sans culpabiliser" }];
}

// Installe le contenu de la semaine sous les noms qu'utilise app.js
function installerContenu(profil, prog, nutri, nutriNext) {
  const opt = profil.options || {};
  window.PRENOM = profil.prenom;
  window.PROFIL = profil;
  window.WEEK_LABEL = prog.label;
  window.PROG_DEMARRAGE = !!prog.demarrage;
  window.DAYS = prog.days;
  window.TRAINING = prog.training || prog.days.filter(d => d.ex.length).map(d => d.id);
  window.RECORDS = prog.records || [];
  window.RECORDS_NOTE = prog.records_note || "";
  window.NUTRI = nutri;
  window.NUTRI_NEXT = nutriNext || null;
  window.FOOD_DAILY = nutri.suivi_quotidien || [];
  window.FOOD_DAY_XP = FOOD_DAILY.reduce((s, f) => s + f.xp, 0);
  // Plan B des jours de flemme : réglage réservé (basse de Ben) ou activité libre du questionnaire
  const pb = (profil.sport || {}).plan_b;
  window.PLANB = opt.plan_b || (pb ? { label: pb, court: "Plan B", options: [{ min: 1, label: "Fait" }] } : null);
  window.REFECTORY_ON = !!opt.refectory;
  const autos = {
    seances: () => TRAINING.every(dayDone),
    records: () => RECORDS.every(r => String(state.records[r.id] || "").trim() !== ""),
  };
  window.QUESTS = (prog.quests || []).map(q => ({ ...q, auto: autos[q.auto] }));
  (nutri.quetes_nutrition || []).forEach(q => QUESTS.push({ id: q.id, food: true, title: q.label.split(" : ")[0], desc: q.label.split(" : ").slice(1).join(" : "), xp: q.xp,
    auto: q.id === "n_batch" ? () => { const c = pickedBatch(NUTRI, ""); return c.length >= 2 && c.every(i => state.food.batch[i]); }
        : q.id === "n_eau" ? () => DAYS.filter(d => (state.food.water[d.id] || 0) >= 8).length >= 5 : undefined }));
  window.MAX_XP = DAYS.reduce((s, d) => s + d.bonus + FOOD_DAY_XP, 0) + QUESTS.reduce((s, q) => s + q.xp, 0);
  window.TIERS = prog.tiers || paliersPour(MAX_XP);
}

// Recettes choisies : toutes par défaut, on décoche celles qu'on ne fait pas (clé "" = semaine en cours, "n" = semaine prochaine)
function pickedBatch(N, pre) { return N.batch_cooking.sessions.map((_, i) => i).filter(i => state.food.pick[pre + i] !== false); }
// Repas : on note où on a mangé ; un repas à l'extérieur compte comme noté mais ne rapporte pas d'XP
function mealChoice(dayId, f) { const v = state.food.daily[dayId + "-" + f.id]; return f.options.find(o => o.id === v) || null; }
function foodItemDone(dayId, f) {
  if (f.type === "compteur") return (state.food.water[dayId] || 0) >= f.max;
  if (f.type === "repas") { const c = mealChoice(dayId, f); return !!c && c.sain !== false; }
  return !!state.food.daily[dayId + "-" + f.id];
}
function foodItemLogged(dayId, f) { return f.type === "repas" ? !!mealChoice(dayId, f) : foodItemDone(dayId, f); }
function foodDayXp(dayId) { return FOOD_DAILY.reduce((s, f) => s + (foodItemDone(dayId, f) ? f.xp : 0), 0); }
function foodDayDone(dayId) { return FOOD_DAILY.length > 0 && FOOD_DAILY.every(f => foodItemLogged(dayId, f)); }
