// Connexion par code reçu par e-mail (ou lien magique dans le navigateur, profil invité), chargement du profil et du contenu de la semaine, sauvegarde de la progression.
// Tables (voir supabase/profils.sql) : profiles, programs et nutrition (une ligne par profil et par semaine), progress (une ligne par compte et par semaine).
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const emptyFood = () => ({ daily: {}, water: {}, batch: {}, courses: {}, pick: {} });
const emptyBilan = () => ({ avis: {}, forme: null, douleur: null, semaine: null, remarque: "", rep: {} });
const freshState = () => ({ lvl: "D", checks: {}, quests: {}, records: {}, alt: {}, food: emptyFood(), bilan: emptyBilan() });
let state = freshState(), user = null, profil = null, WEEK = null, KEY = null, dbTimer = null, appStarted = false;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  if (!user) return;
  clearTimeout(dbTimer);
  dbTimer = setTimeout(async () => {
    const { error } = await sb.from("progress").upsert({ user_id: user.id, week: WEEK, data: state, updated_at: new Date().toISOString() });
    setSync(error ? "Enregistrement en ligne impossible, gardé sur cet appareil." : "Progression enregistrée en ligne.");
  }, 800);
}
function setSync(t) { const el = document.getElementById("sync"); if (el) el.textContent = t; }

async function loadProgress() {
  const { data, error } = await sb.from("progress").select("data").eq("week", WEEK).maybeSingle();
  if (error) { setSync("Hors ligne : progression gardée sur cet appareil."); return; }
  if (data) {
    const d = data.data || {};
    state = { lvl: d.lvl || state.lvl, checks: d.checks || {}, quests: d.quests || {}, records: d.records || {}, alt: d.alt || {}, food: Object.assign(emptyFood(), d.food || {}), bilan: Object.assign(emptyBilan(), d.bilan || {}) };
    renderAll(true);
  } else if (Object.keys(state.checks).length || Object.keys(state.quests).length) save();
  setSync("Progression enregistrée en ligne.");
}

// Écran de connexion : on tape son e-mail, on reçoit un code à taper dans l'appli (le lien du même e-mail marche aussi dans le navigateur).
// Le code est indispensable sur iPhone : l'appli ajoutée à l'écran d'accueil ne partage pas sa session avec Safari, où s'ouvre le lien.
// Les inscriptions sont fermées : l'admin crée le profil dans l'appli puis invite la personne depuis Supabase.
const login = document.getElementById("login"), loginForm = document.getElementById("login-form"), codeForm = document.getElementById("code-form");
let emailEnCours = "";
function showLogin(on, msg) {
  login.hidden = !on; document.body.classList.toggle("locked", on);
  loginForm.hidden = !!msg; codeForm.hidden = true;
  document.getElementById("login-stop").hidden = !msg;
  if (msg) { document.getElementById("login-stop-msg").textContent = msg; document.getElementById("login-out").hidden = false; }
}
function etapeCode(email) {
  emailEnCours = email;
  loginForm.hidden = true; codeForm.hidden = false;
  document.getElementById("code-info").textContent = "Code envoyé à " + email + ". Tape-le ici (pas besoin d'ouvrir le lien).";
  document.getElementById("code-msg").textContent = "";
  const input = document.getElementById("login-code"); input.value = ""; input.focus();
}
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("login-btn"), email = document.getElementById("login-email").value.trim().toLowerCase();
  if (!email) return;
  btn.disabled = true;
  const { error } = await envoyerLien(email);
  btn.disabled = false;
  if (error) { document.getElementById("login-msg").textContent = messageLien(error); return; }
  document.getElementById("login-msg").textContent = "";
  etapeCode(email);
});
codeForm.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("code-btn"), msg = document.getElementById("code-msg");
  const token = document.getElementById("login-code").value.replace(/\D/g, "");
  if (token.length < 6) { msg.textContent = "Le code fait 6 chiffres."; return; }
  btn.disabled = true; msg.textContent = "Vérification…";
  const { error } = await sb.auth.verifyOtp({ email: emailEnCours, token, type: "email" });
  btn.disabled = false;
  // En cas de succès, onAuthStateChange démarre l'appli.
  msg.textContent = error ? messageCode(error) : "Connecté !";
});
document.getElementById("code-back").addEventListener("click", () => {
  codeForm.hidden = true; loginForm.hidden = false;
  document.getElementById("login-msg").textContent = "";
});
function envoyerLien(email) {
  return sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
}
function messageCode(error) {
  const m = (error.message || "").toLowerCase();
  if (m.includes("expired") || m.includes("invalid") || error.status === 403) return "Code incorrect ou expiré. Vérifie le dernier e-mail reçu, ou demande un nouveau code.";
  if (error.status === 429 || m.includes("rate limit")) return "Trop d'essais : réessaie dans quelques minutes.";
  return "Connexion impossible : " + error.message;
}
function messageLien(error) {
  const m = (error.message || "").toLowerCase();
  if (m.includes("database error") || m.includes("non invitée") || m.includes("signups not allowed")) return "Cette adresse n'a pas encore de compte Marcel. Demande à Ben de t'inviter.";
  if (error.status === 429 || m.includes("rate limit") || m.includes("seconds")) return "Trop d'envois d'affilée : réessaie dans quelques minutes.";
  return "Envoi impossible : " + error.message;
}
async function deconnexion() { await sb.auth.signOut(); try { localStorage.removeItem("marcel-contenu"); } catch (e) {} location.reload(); }
document.getElementById("login-out").addEventListener("click", deconnexion);

// Contenu gardé sur l'appareil pour ouvrir l'appli hors ligne
function lireCache(uid) { try { const c = JSON.parse(localStorage.getItem("marcel-contenu") || "null"); return c && c.uid === uid ? c : null; } catch (e) { return null; } }
function ecrireCache(c) { try { localStorage.setItem("marcel-contenu", JSON.stringify(c)); } catch (e) {} }

const manque = (kind, p) => !p[kind] || Q_REQUIS[kind].some(k => { const v = p[kind][k]; return v == null || v === "" || (Array.isArray(v) && !v.length); });

async function chargerProfil() {
  const { data, error } = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) return { horsLigne: true };
  return { data };
}

// Programme de la semaine : celui de la semaine prochaine s'il est déjà publié (dimanche soir), sinon la semaine en cours,
// sinon un programme de démarrage construit depuis le questionnaire.
async function chargerSemaine(p) {
  const today = new Date(), next = new Date(today); next.setDate(next.getDate() + 7);
  const w0 = semaineId(today), w1 = semaineId(next), w2 = semaineId(new Date(next.getTime() + 7 * 86400000));
  const [pr, nu] = await Promise.all([
    sb.from("programs").select("week,data").eq("profile_id", p.id).in("week", [w0, w1]),
    sb.from("nutrition").select("week,data").eq("profile_id", p.id).in("week", [w0, w1, w2]),
  ]);
  if (pr.error || nu.error) return null;
  const P = Object.fromEntries(pr.data.map(r => [r.week, r.data])), N = Object.fromEntries(nu.data.map(r => [r.week, r.data]));
  const week = P[w1] && P[w1].days ? w1 : w0, after = week === w1 ? w2 : w1;
  // Une ligne sans jours = seulement le bilan du samedi pour un profil encore en programme de démarrage
  const row = P[week], prog = row && row.days ? row : Object.assign(programmeDemarrage(p.sport, today), row && row.bilan ? { bilan: row.bilan } : {});
  return { week, prog, nutri: N[week] || nutritionDemarrage(p.nutrition), nutriNext: N[after] || null };
}

async function demarrer(session) {
  user = session ? session.user : null;
  if (!user) { showLogin(true); return; }
  let c = null;
  const r = await chargerProfil();
  if (r.horsLigne) c = lireCache(user.id);
  else if (!r.data) { showLogin(true, "Ton profil n'existe pas ou a été désactivé. Demande à Ben de t'inviter."); return; }
  else {
    profil = r.data;
    sb.from("profiles").update({ vu_le: new Date().toISOString() }).eq("id", profil.id).then(() => {});
    for (const kind of ["sport", "nutrition"]) if (manque(kind, profil)) { showLogin(false); profil = await ouvrirQuestionnaire(kind, profil, true); }
    const s = await chargerSemaine(profil);
    c = s ? { uid: user.id, profil, ...s } : lireCache(user.id);
    if (s) ecrireCache(c);
  }
  if (!c) { showLogin(true, "Pas de connexion internet : impossible de charger ta semaine. Réessaie dans un instant."); return; }
  showLogin(false);
  profil = c.profil; WEEK = c.week; KEY = "marcel-" + WEEK;
  installerContenu(profil, c.prog, c.nutri, c.nutriNext);
  state = freshState();
  if (profil.sport && profil.sport.niveau && profil.sport.niveau !== "debutant") state.lvl = "I";
  try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); state.food = Object.assign(emptyFood(), state.food || {}); state.bilan = Object.assign(emptyBilan(), state.bilan || {}); } catch (e) {}
  appStarted = true;
  const s = document.createElement("script"); s.src = "js/app.js?v=" + APP_VERSION; document.body.appendChild(s);
}

let lastUid;
sb.auth.onAuthStateChange((event, session) => {
  const uid = session ? session.user.id : null;
  if (uid === lastUid) return;
  if (appStarted) { location.reload(); return; }
  lastUid = uid;
  setTimeout(() => demarrer(session), 0);
});
