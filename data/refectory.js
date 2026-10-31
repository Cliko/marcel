// Choix Refectory de la semaine, préparés par Marcel le dimanche à partir du menu du compte de Ben (lecture seule).
// Ben commande le lundi, mardi et jeudi ; le mercredi seulement s'il est au bureau ; jamais le vendredi (télétravail).
// null = pas de sélection cette semaine. Champs : jours[].date (AAAA-MM-JJ), jours[].note (facultatif), jours[].choix[] = {nom, kcal, proteines, prix, pourquoi}.
const REFECT_PICKS = {
  "semaine": "s45",
  "maj": "2026-10-31",
  "jours": [
    {"date": "2026-11-02", "choix": [
      {"nom": "Bowl poulet sésame", "kcal": 540, "proteines": 25, "prix": 10.9, "pourquoi": "Poulet, boulgour, carottes rôties et edamame"},
      {"nom": "Jambalaya aux crevettes", "kcal": 504, "proteines": 26, "prix": 11.9, "pourquoi": "Crevettes et sauce tomate, sans crème"}]},
    {"date": "2026-11-03", "choix": [
      {"nom": "Lieu noir, purée de butternut et graines de courges", "kcal": null, "proteines": null, "prix": 12.2, "pourquoi": "Poisson poêlé et courge, peu de féculent"},
      {"nom": "Colin, compotée d'oignons et lard fumé", "kcal": 449, "proteines": 24, "prix": 11.5, "pourquoi": "Poisson et patate douce, le plus léger des plats protéinés"}]},
    {"date": "2026-11-04", "note": "si tu es au bureau", "choix": [
      {"nom": "Jambalaya aux crevettes", "kcal": 504, "proteines": 26, "prix": 11.9, "pourquoi": "Crevettes et sauce tomate, sans crème"},
      {"nom": "Bowl poulet sésame", "kcal": 540, "proteines": 25, "prix": 10.9, "pourquoi": "Poulet, boulgour, carottes rôties et edamame"}]},
    {"date": "2026-11-05", "choix": [
      {"nom": "Poulet sauce colombo, mousseline de patates douces", "kcal": 521, "proteines": 38, "prix": 10.9, "pourquoi": "Le plus protéiné de la carte, avec poivrons"},
      {"nom": "Lieu noir, purée de butternut et graines de courges", "kcal": null, "proteines": null, "prix": 12.2, "pourquoi": "Poisson poêlé et courge, peu de féculent"}]}
  ]
};
