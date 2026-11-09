// Choix Refectory de la semaine, préparés par Marcel le dimanche à partir du menu du compte de Ben (lecture seule).
// Ben commande le lundi, mardi et jeudi ; le mercredi seulement s'il est au bureau ; jamais le vendredi (télétravail).
// null = pas de sélection cette semaine. Champs : jours[].date (AAAA-MM-JJ), jours[].note (facultatif), jours[].choix[] = {nom, kcal, proteines, prix, pourquoi}.
const REFECT_PICKS = {
  "semaine": "s46",
  "maj": "2026-11-09",
  "jours": [
    {"date": "2026-11-09", "choix": [
      {"nom": "Bowl poulet sésame", "kcal": 540, "proteines": 25, "prix": 10.9, "pourquoi": "Poulet, boulgour, carottes rôties et edamame"},
      {"nom": "Parmentier de lentilles & potimarron", "kcal": 416, "proteines": 16, "prix": 9.9, "pourquoi": "Le plus léger de la carte, lentilles et courge riches en fibres"}]},
    {"date": "2026-11-10", "choix": [
      {"nom": "Cabillaud, aux épices douces & butternut", "kcal": 382, "proteines": 21, "prix": 13.9, "pourquoi": "Poisson blanc et courge, le moins calorique du jour"},
      {"nom": "Poulet paprika, écrasé à l'huile d'olive & fondue de poireaux", "kcal": 454, "proteines": 24, "prix": 12.9, "pourquoi": "Poulet et poireaux, petite portion de pomme de terre"}]},
    {"date": "2026-11-12", "choix": [
      {"nom": "Crevettes sautées aux deux poivres", "kcal": 479, "proteines": 18, "prix": 11.9, "pourquoi": "Crevettes, poivrons et riz basmati, sans crème"},
      {"nom": "Lieu noir, purée de butternut et graines de courges", "kcal": null, "proteines": null, "prix": 12.2, "pourquoi": "Poisson poêlé et courge, peu de féculent"}]}
  ]
};
