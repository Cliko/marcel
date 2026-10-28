// Connexion (lien reçu par e-mail, compte unique) et sauvegarde de la progression dans Supabase, avec copie locale de secours.
// Table public.progress : une ligne par semaine (week = WEEK), protégée par RLS (chacun ne voit que ses lignes).
const KEY = "marcel-" + WEEK;
const emptyFood = () => ({ daily: {}, water: {}, batch: {}, courses: {} });
let state = { lvl: "D", checks: {}, quests: {}, records: {}, food: emptyFood() };
try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(state, JSON.parse(raw)); state.food = Object.assign(emptyFood(), state.food || {}); } catch (e) {}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
let user = null, dbTimer = null;

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
    state = { lvl: d.lvl || state.lvl, checks: d.checks || {}, quests: d.quests || {}, records: d.records || {}, food: Object.assign(emptyFood(), d.food || {}) };
    ["push", "pull", "plank"].forEach(k => document.getElementById("rec-" + k).value = state.records[k] || "");
    renderAll(true);
  } else if (Object.keys(state.checks).length || Object.keys(state.quests).length) save();
  setSync("Progression enregistrée en ligne.");
}

// Écran de connexion : un seul compte (SUPABASE_LOGIN), le bouton envoie un lien de connexion à cette adresse
const login = document.getElementById("login");
function showLogin(on) { login.hidden = !on; document.body.classList.toggle("locked", on); }
document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  const { error } = await sb.auth.signInWithOtp({ email: SUPABASE_LOGIN, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
  document.getElementById("login-msg").textContent = error ? "Envoi impossible : " + error.message : "E-mail envoyé : ouvre le lien reçu sur ce téléphone.";
  btn.disabled = false;
});
document.getElementById("logout").addEventListener("click", () => sb.auth.signOut());

function startSync() {
  sb.auth.onAuthStateChange((event, session) => {
    const was = user && user.id;
    user = session ? session.user : null;
    showLogin(!user);
    if (user && user.id !== was) setTimeout(loadProgress, 0);
  });
}
