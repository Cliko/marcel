// Choix Refectory de la semaine, préparés par Marcel le dimanche à partir du menu du compte de Ben (lecture seule).
// Ben commande le lundi, mardi et jeudi ; le mercredi seulement s'il est au bureau ; jamais le vendredi (télétravail).
// null = pas de sélection cette semaine. Champs : jours[].date (AAAA-MM-JJ), jours[].note (facultatif), jours[].choix[] = {nom, kcal, proteines, prix, pourquoi}.
const REFECT_PICKS = {
  "semaine": "s48",
  "maj": "2026-11-22",
  "jours": [
    {"date": "2026-11-23", "choix": [{"nom": "Poulet sauté au basilic thaï", "kcal": 500, "proteines": 32, "prix": 9.9, "pourquoi": "Le meilleur ratio de la carte : 32 g de protéines pour 500 kcal, poulet, poivrons et haricots verts, riz basmati"}, {"nom": "Jambalaya aux crevettes", "kcal": 504, "proteines": 26, "prix": 11.9, "pourquoi": "Crevettes et riz à la tomate, épicé et léger en graisses (17 g)"}]},
    {"date": "2026-11-24", "choix": [{"nom": "Colin, sauce vierge d'hiver et riz complet", "kcal": 496, "proteines": 24, "prix": 12.9, "pourquoi": "Poisson blanc, riz complet et brocolis, sauce à l'huile d'olive, le plus riche en fibres (11 g)"}, {"nom": "Bowl poulet sésame", "kcal": 540, "proteines": 25, "prix": 10.9, "pourquoi": "Poulet, boulgour, carottes rôties et edamame (extrait de shiitake seulement dans la sauce)"}]},
    {"date": "2026-11-25", "note": "si tu es au bureau", "choix": [{"nom": "Jambalaya aux crevettes", "kcal": 504, "proteines": 26, "prix": 11.9, "pourquoi": "Crevettes et riz à la tomate, épicé et léger en graisses (17 g)"}, {"nom": "Salade façon César", "kcal": 644, "proteines": 37, "prix": 10.5, "pourquoi": "La plus protéinée de la carte (poulet, œufs) ; un peu de pâtes, garde la sauce légère"}]},
    {"date": "2026-11-26", "choix": [{"nom": "Poulet sauté au basilic thaï", "kcal": 500, "proteines": 32, "prix": 9.9, "pourquoi": "Le meilleur ratio de la carte : 32 g de protéines pour 500 kcal, poulet, poivrons et haricots verts, riz basmati"}, {"nom": "Colin, sauce vierge d'hiver et riz complet", "kcal": 496, "proteines": 24, "prix": 12.9, "pourquoi": "Poisson blanc, riz complet et brocolis, sauce à l'huile d'olive, le plus riche en fibres (11 g)"}]}
  ]
};
