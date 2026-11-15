// Choix Refectory de la semaine, préparés par Marcel le dimanche à partir du menu du compte de Ben (lecture seule).
// Ben commande le lundi, mardi et jeudi ; le mercredi seulement s'il est au bureau ; jamais le vendredi (télétravail).
// null = pas de sélection cette semaine. Champs : jours[].date (AAAA-MM-JJ), jours[].note (facultatif), jours[].choix[] = {nom, kcal, proteines, prix, pourquoi}.
const REFECT_PICKS = {
  "semaine": "s47",
  "maj": "2026-11-15",
  "jours": [
    {"date": "2026-11-16", "choix": [{"nom": "Colin, sauce vierge d'hiver et riz complet", "kcal": 496, "proteines": 24, "prix": 12.9, "pourquoi": "Poisson blanc, riz complet et brocolis, sauce à l'huile d'olive, le plus léger du jour"}, {"nom": "Bowl poulet sésame", "kcal": 540, "proteines": 25, "prix": 10.9, "pourquoi": "Poulet, boulgour, carottes rôties et edamame, riche en fibres"}]},
    {"date": "2026-11-17", "choix": [{"nom": "Salade façon César", "kcal": 644, "proteines": 37, "prix": 10.5, "pourquoi": "Le plus protéiné de la carte (poulet, œufs) ; un peu de pâtes, garde la sauce légère"}, {"nom": "Mini Saint-Jacques, topinambour, émulsion d'agrumes", "kcal": 491, "proteines": 20, "prix": 13.9, "pourquoi": "Fruits de mer et topinambour, calories modérées (un peu de crème dans la purée)"}]},
    {"date": "2026-11-18", "note": "si tu es au bureau", "choix": [{"nom": "Bowl poulet sésame", "kcal": 540, "proteines": 25, "prix": 10.9, "pourquoi": "Poulet, boulgour, carottes rôties et edamame, riche en fibres"}, {"nom": "Salade façon César", "kcal": 644, "proteines": 37, "prix": 10.5, "pourquoi": "Le plus protéiné de la carte (poulet, œufs) ; un peu de pâtes, garde la sauce légère"}]},
    {"date": "2026-11-19", "choix": [{"nom": "Curry jaune de crevettes", "kcal": 521, "proteines": 32, "prix": 11.9, "pourquoi": "Nouveau : crevettes, poivrons et riz, 32 g de protéines"}, {"nom": "Colin, sauce vierge d'hiver et riz complet", "kcal": 496, "proteines": 24, "prix": 12.9, "pourquoi": "Poisson blanc, riz complet et brocolis, sauce à l'huile d'olive, le plus léger du jour"}]}
  ]
};
