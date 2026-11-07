#!/usr/bin/env node
// Publie le contenu d'une semaine pour un profil dans Supabase (clé secrète dans SUPABASE_SECRET_KEY).
// Utilisé par les tâches du dimanche (programme sport) et du vendredi (recettes).
//
//   node outils/publier.js profils                              liste les profils actifs et leurs questionnaires (JSON)
//   node outils/publier.js programme <email> <sXX> <fichier.json>   écrit programs (format : voir LISEZ-MOI)
//   node outils/publier.js nutrition <email> <sXX> <fichier.json> [--sans-notif]
//                                                               écrit nutrition (format de NUTRI) puis prévient le profil que ses recettes sont prêtes
//   node outils/publier.js progression <email> <sXX>               affiche la progression de la semaine (JSON)
//   node outils/publier.js bilan <email> <sXX> <fichier.json>       ajoute les propositions du samedi au programme de sXX (format : voir LISEZ-MOI)
//   node outils/publier.js push-cles                                crée les clés VAPID des notifications si elles manquent
//   node outils/publier.js notifier <email> <titre> <texte> [url]   envoie une notification à chaque téléphone abonné du profil
//   node outils/publier.js migrer <email>                           convertit data/semaine.js et data/prochaine.js et les publie
// (web-push, pour les notifications, s'installe tout seul au premier envoi)
const fs = require("fs"), path = require("path"), vm = require("vm");
const URL_SB = "https://xstnbuoussiirpnitgep.supabase.co/rest/v1/";
const KEY = process.env.SUPABASE_SECRET_KEY;
if (!KEY) { console.error("SUPABASE_SECRET_KEY manquante"); process.exit(1); }
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

async function api(chemin, opts = {}) {
  const r = await fetch(URL_SB + chemin, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(r.status + " " + t);
  return t ? JSON.parse(t) : null;
}
async function profil(email) {
  const l = await api("profiles?select=id,user_id,prenom,email&email=eq." + encodeURIComponent(email.toLowerCase()));
  if (!l.length) throw new Error("Pas de profil pour " + email);
  return l[0];
}
async function ecrire(table, email, week, data) {
  const p = await profil(email);
  verifier(table, data);
  await api(table + "?on_conflict=profile_id,week", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ profile_id: p.id, week, data, updated_at: new Date().toISOString() }) });
  console.log(`${table} ${week} publié pour ${p.prenom} (${p.email})`);
}
// Contrôles de forme avant publication : évite de casser l'appli d'une personne
function verifier(table, d) {
  const err = m => { throw new Error(table + " invalide : " + m); };
  if (table === "programs") {
    if (d.changements && (!Array.isArray(d.changements) || !d.changements.every(c => typeof c === "string"))) err("changements = liste de phrases");
    if (!d.label || !Array.isArray(d.days) || d.days.length !== 7) err("label et 7 jours requis");
    d.days.forEach(j => {
      ["id", "date", "iso", "title"].forEach(k => j[k] || err(`jour sans ${k}`));
      if (typeof j.bonus !== "number" || !Array.isArray(j.ex)) err(`jour ${j.id} : bonus ou ex manquant`);
      j.ex.forEach(e => (Array.isArray(e) && e.length === 6) || err(`jour ${j.id} : exercice au mauvais format (6 champs)`));
    });
    (d.quests || []).forEach(q => (q.id && q.title && typeof q.xp === "number") || err("quête incomplète"));
    if (d.records && !d.records.every(r => r.id && r.label)) err("record incomplet");
  } else if (table === "bilan") {
    if (!Array.isArray(d.propositions) || d.propositions.length > 5) err("propositions requises (5 au plus)");
    const ids = new Set();
    d.propositions.forEach(p => { (p.id && p.titre) || err("proposition sans id ou titre"); ids.has(p.id) && err("id en double : " + p.id); ids.add(p.id); });
  } else {
    if (!Array.isArray(d.suivi_quotidien) || !d.batch_cooking || !Array.isArray(d.batch_cooking.sessions)) err("suivi_quotidien et batch_cooking.sessions requis");
  }
}

// Notification push vers chaque téléphone abonné du profil ; les abonnements expirés sont supprimés
function webPush() {
  try { return require("web-push"); }
  catch (e) {
    require("child_process").execSync("npm install --prefix " + JSON.stringify(__dirname) + " --silent", { stdio: "ignore" });
    return require("web-push");
  }
}
// Semaine ISO (sXX) d'une date
function semaineIso(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return "s" + Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
// Après publication des recettes : notification « recettes prêtes » (sans jamais faire échouer la publication)
async function notifierRecettes(email, week, data) {
  const noms = data.batch_cooking.sessions.map(s => s.recette).filter(Boolean);
  const prochaine = week === semaineIso(new Date(Date.now() + 7 * 864e5));
  const titre = prochaine ? "Tes recettes de la semaine prochaine sont prêtes" : "Tes recettes de la semaine sont prêtes";
  const texte = (noms.length ? noms.join(", ") + ". " : "") + (prochaine ? "Choisis les tiennes et fais tes courses ce week-end." : "Choisis les tiennes dans l'onglet Nutrition.");
  try { await notifier(email, titre, texte, "./?recettes"); }
  catch (e) { console.log("notification non envoyée : " + e.message); }
}

async function notifier(email, titre, texte, lien) {
  const webpush = webPush(), p = await profil(email);
  const cles = Object.fromEntries((await api("reglages?select=cle,valeur&cle=in.(vapid_public,vapid_private)")).map(r => [r.cle, r.valeur]));
  if (!cles.vapid_private) throw new Error("clés VAPID absentes : lance push-cles");
  webpush.setVapidDetails("https://cliko.github.io/marcel/", cles.vapid_public, cles.vapid_private);
  const subs = await api(`push_abonnements?select=endpoint,abonnement&profile_id=eq.${p.id}`);
  if (!subs.length) { console.log(`${p.prenom} : aucun téléphone abonné`); return; }
  const charge = JSON.stringify({ title: titre, body: texte || "", url: lien || "./" });
  let ok = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s.abonnement, charge, { TTL: 86400 }); ok++; }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await api("push_abonnements?endpoint=eq." + encodeURIComponent(s.endpoint), { method: "DELETE" });
      else console.error(`envoi impossible (${e.statusCode || ""}) : ${e.body || e.message}`);
    }
  }
  console.log(`${p.prenom} : notification envoyée à ${ok}/${subs.length} téléphone(s)`);
}

// Conversion de l'ancien format (data/semaine.js, data/prochaine.js) vers le format par profil
function lireAncien() {
  const racine = path.join(__dirname, "..");
  const ctx = { state: { records: {}, food: { batch: {}, water: {}, pick: {} } }, dayDone: () => false, pickedBatch: () => [], console };
  vm.createContext(ctx);
  const code = fs.readFileSync(path.join(racine, "data/semaine.js"), "utf8").replace(/^const (\w+)/gm, "var $1");
  vm.runInContext(code + "\n;var __TRAINING = typeof TRAINING !== 'undefined' ? TRAINING : null;", ctx);
  const next = fs.readFileSync(path.join(racine, "data/prochaine.js"), "utf8").replace(/^const (\w+)/gm, "var $1");
  vm.runInContext(next, ctx);
  const autoDe = { assidu: "seances", records: "records" };
  const prog = {
    label: ctx.WEEK_LABEL, days: ctx.DAYS, training: ctx.__TRAINING || undefined,
    quests: ctx.QUESTS.filter(q => !q.food).map(({ id, title, desc, xp }) => ({ id, title, desc, xp, ...(autoDe[id] ? { auto: autoDe[id] } : {}) })),
    tiers: ctx.TIERS,
    records: [{ id: "push", label: "Pompes max", unit: "reps" }, { id: "pull", label: "Rowing table", unit: "reps" }, { id: "plank", label: "Planche max", unit: "sec" }],
    records_note: "Au poids du corps uniquement, sans barre. Ces chiffres servent à calibrer la semaine suivante.",
  };
  // Jours d'endurance (vélo, piscine) : bonus d'eau dans le suivi nutrition
  prog.days.forEach(d => { if (d.cardio === undefined) d.cardio = /vélo|natation|piscine/i.test(d.title + " " + d.note); });
  return { week: ctx.WEEK, prog, nutri: ctx.NUTRI, next: ctx.NUTRI_NEXT };
}

(async () => {
  const [cmd, email, week, fichier] = process.argv.slice(2);
  if (cmd === "profils") {
    console.log(JSON.stringify(await api("profiles?select=id,prenom,email,role,actif,user_id,sport,nutrition,options,sport_maj,nutrition_maj&actif=eq.true&order=created_at"), null, 2));
  } else if (cmd === "programme" || cmd === "nutrition") {
    if (!email || !/^s\d+$/.test(week || "") || !fichier) throw new Error("usage : " + cmd + " <email> <sXX> <fichier.json>");
    const data = JSON.parse(fs.readFileSync(fichier, "utf8"));
    await ecrire(cmd === "programme" ? "programs" : "nutrition", email, week, data);
    if (cmd === "nutrition" && !process.argv.includes("--sans-notif")) await notifierRecettes(email, week, data);
  } else if (cmd === "progression") {
    const p = await profil(email);
    if (!p.user_id) { console.log("null"); return; }
    const l = await api(`progress?select=week,data,updated_at&user_id=eq.${p.user_id}&week=eq.${week}`);
    console.log(JSON.stringify(l[0] || null, null, 2));
  } else if (cmd === "bilan") {
    // Les propositions vont dans le programme de la semaine en cours (programs.data.bilan), sans toucher au reste
    if (!email || !/^s\d+$/.test(week || "") || !fichier) throw new Error("usage : bilan <email> <sXX> <fichier.json>");
    const b = JSON.parse(fs.readFileSync(fichier, "utf8")), p = await profil(email);
    verifier("bilan", b);
    const l = await api(`programs?select=data&profile_id=eq.${p.id}&week=eq.${week}`);
    const data = { ...(l[0] ? l[0].data : {}), bilan: { ...b, maj: new Date().toISOString() } };
    await api("programs?on_conflict=profile_id,week", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ profile_id: p.id, week, data, updated_at: new Date().toISOString() }) });
    console.log(`bilan ${week} publié pour ${p.prenom} (${b.propositions.length} propositions)`);
  } else if (cmd === "push-cles") {
    const l = await api("reglages?select=cle&cle=in.(vapid_public,vapid_private)");
    if (l.length === 2) { console.log("clés VAPID déjà en place"); return; }
    const k = webPush().generateVAPIDKeys();
    await api("reglages?on_conflict=cle", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ cle: "vapid_public", valeur: k.publicKey }, { cle: "vapid_private", valeur: k.privateKey }]) });
    console.log("clés VAPID créées");
  } else if (cmd === "notifier") {
    const [, , titre, texte, lien] = process.argv.slice(2);
    if (!email || !titre) throw new Error("usage : notifier <email> <titre> <texte> [url]");
    await notifier(email, titre, texte, lien);
  } else if (cmd === "migrer") {
    const a = lireAncien();
    await ecrire("programs", email, a.week, a.prog);
    await ecrire("nutrition", email, a.week, a.nutri);
    if (a.next && a.next.semaine) await ecrire("nutrition", email, a.next.semaine, a.next);
  } else if (cmd === "convertir") {
    console.log(JSON.stringify(lireAncien(), null, 2));
  } else {
    console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 10).join("\n"));
  }
})().catch(e => { console.error(e.message); process.exit(1); });
