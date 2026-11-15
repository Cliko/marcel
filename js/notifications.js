// Notifications push : Marcel prévient quand le bilan du samedi est prêt (et quand la nouvelle semaine est publiée).
// Le téléphone s'abonne ici (clé publique VAPID lue dans la table reglages) ; l'abonnement est rangé dans push_abonnements
// et outils/publier.js (commande notifier) envoie la notification avec la clé privée, gardée côté Supabase.
// Sur Android, ça marche dans Chrome, que l'appli soit installée ou non ; sur iPhone, seulement une fois l'appli ajoutée à l'écran d'accueil.

const pushPossible = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function b64ToBytes(b64) {
  const s = atob((b64 + "=".repeat((4 - b64.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}
async function abonnementActuel() {
  if (!pushPossible()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}
async function enregistrerAbonnement(sub) {
  const ligne = { endpoint: sub.endpoint, profile_id: PROFIL.id, abonnement: sub.toJSON(), appareil: navigator.userAgent.slice(0, 120) };
  let { error } = await sb.from("push_abonnements").upsert({ ...ligne, vu_le: new Date().toISOString() });
  // Colonne vu_le absente tant que la dernière version de supabase/notifications.sql n'a pas été lancée
  if (error && /vu_le/.test(error.message || "")) ({ error } = await sb.from("push_abonnements").upsert(ligne));
  if (error) throw new Error("Abonnement impossible : " + error.message);
}
async function abonner() {
  const { data, error } = await sb.from("reglages").select("valeur").eq("cle", "vapid_public").maybeSingle();
  if (error || !data) throw new Error("Les notifications ne sont pas encore prêtes côté Marcel. Réessaie un peu plus tard.");
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("sw.js"));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(data.valeur) });
  await enregistrerAbonnement(sub);
}
async function activerNotifs() {
  if (!pushPossible()) throw new Error("Ce navigateur ne gère pas les notifications. Sur iPhone, ajoute d'abord l'appli à l'écran d'accueil.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications refusées. Tu peux les autoriser dans les réglages du site, puis réessayer.");
  await abonner();
}
// À chaque ouverture : si les notifications sont autorisées, on refait (ou recrée) l'abonnement et on le range à nouveau,
// au cas où le navigateur l'aurait changé ou que Marcel l'ait supprimé après un échec. Silencieux.
async function rafraichirAbonnement() {
  try {
    if (!pushPossible() || Notification.permission !== "granted" || !window.PROFIL) return;
    await abonner();
  } catch (e) {}
}
// Notification locale (sans passer par Google ou Apple) : vérifie que le téléphone affiche bien les notifications de Marcel
async function notifTest() {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification("Test Marcel", { body: "Si tu lis ceci, ton téléphone affiche bien les notifications de Marcel.",
    icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "marcel-test", data: { url: "./" } });
}
async function etatEnvoi() {
  const sub = await abonnementActuel(); if (!sub) return null;
  const { data } = await sb.from("push_abonnements").select("envoi_le,envoi_ok,envoi_erreur").eq("endpoint", sub.endpoint).maybeSingle();
  return data || null;
}
const dateHeure = d => new Date(d).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
async function couperNotifs() {
  const sub = await abonnementActuel();
  if (!sub) return;
  await sb.from("push_abonnements").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

// Bouton d'activation (dans le bilan en version courte, dans le profil avec le bouton pour couper)
async function renderNotifBouton(el, court) {
  if (!el) return;
  if (!pushPossible()) { el.innerHTML = court ? "" : `<p class="rules">Ce navigateur ne gère pas les notifications. Sur iPhone, ajoute d'abord l'appli à l'écran d'accueil.</p>`; return; }
  let sub = null;
  try { sub = await abonnementActuel(); } catch (e) {}
  const on = !!sub && Notification.permission === "granted";
  if (on && court) { el.innerHTML = `<p class="rules">🔔 Tu recevras une notification quand elles seront prêtes.</p>`; return; }
  let envoi = "";
  if (on && !court) {
    const e = await etatEnvoi().catch(() => null);
    envoi = e && e.envoi_le ? (e.envoi_ok ? `Dernière notification envoyée ${dateHeure(e.envoi_le)}.` : `Échec du dernier envoi (${dateHeure(e.envoi_le)}) : ${esc(e.envoi_erreur || "erreur inconnue")}.`) : "Aucune notification envoyée depuis l'activation.";
  }
  el.innerHTML = on
    ? `<div class="foot"><span>🔔 Notifications activées sur ce téléphone.</span><span><button class="linkbtn" type="button" data-notif="test">Tester</button> <button class="linkbtn" type="button" data-notif="off">Couper</button></span></div>
       <p class="rules" role="status" data-notif-msg>${envoi}</p>`
    : `<div class="foot"><span>${court ? "Être prévenu quand le bilan est prêt :" : "Marcel te prévient quand ton bilan du samedi et ta nouvelle semaine sont prêts."}</span>
        <button class="linkbtn" type="button" data-notif="on">Activer les notifications</button></div><p class="rules" role="status" data-notif-msg>${
          !court && Notification.permission === "denied" ? "Les notifications sont bloquées pour ce site : autorise-les dans les réglages du navigateur (cadenas à gauche de l'adresse, ou Paramètres > Applis), puis réessaie." : ""}</p>`;
  el.onclick = async e => {
    const b = e.target.closest("[data-notif]"); if (!b) return;
    b.disabled = true;
    try {
      if (b.dataset.notif === "test") {
        await notifTest(); b.disabled = false;
        const m = el.querySelector("[data-notif-msg]");
        if (m) m.textContent = "Notification de test affichée ? Alors ton téléphone est prêt. Sinon, vérifie les réglages de notifications et d'économie de batterie de ton navigateur (ou de l'appli Marcel si tu l'as installée).";
        return;
      }
      if (b.dataset.notif === "on") { await activerNotifs(); toast("Notifications activées", "Marcel te prévient samedi soir", "🔔"); }
      else await couperNotifs();
      renderNotifBouton(el, court);
    } catch (err) {
      b.disabled = false;
      const m = el.querySelector("[data-notif-msg]"); if (m) m.textContent = err.message;
    }
  };
}
