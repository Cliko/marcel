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
async function activerNotifs() {
  if (!pushPossible()) throw new Error("Ce navigateur ne gère pas les notifications. Sur iPhone, ajoute d'abord l'appli à l'écran d'accueil.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications refusées. Tu peux les autoriser dans les réglages du site, puis réessayer.");
  const { data, error } = await sb.from("reglages").select("valeur").eq("cle", "vapid_public").maybeSingle();
  if (error || !data) throw new Error("Les notifications ne sont pas encore prêtes côté Marcel. Réessaie un peu plus tard.");
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("sw.js"));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(data.valeur) });
  const { error: err } = await sb.from("push_abonnements").upsert({ endpoint: sub.endpoint, profile_id: PROFIL.id, abonnement: sub.toJSON(),
    appareil: navigator.userAgent.slice(0, 120) });
  if (err) throw new Error("Abonnement impossible : " + err.message);
}
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
  el.innerHTML = on
    ? `<div class="foot"><span>🔔 Notifications activées sur ce téléphone.</span><button class="linkbtn" type="button" data-notif="off">Couper</button></div>`
    : `<div class="foot"><span>${court ? "Être prévenu quand le bilan est prêt :" : "Marcel te prévient quand ton bilan du samedi et ta nouvelle semaine sont prêts."}</span>
        <button class="linkbtn" type="button" data-notif="on">Activer les notifications</button></div><p class="rules" role="status" data-notif-msg></p>`;
  el.onclick = async e => {
    const b = e.target.closest("[data-notif]"); if (!b) return;
    b.disabled = true;
    try {
      if (b.dataset.notif === "on") { await activerNotifs(); toast("Notifications activées", "Marcel te prévient samedi soir", "🔔"); }
      else await couperNotifs();
      renderNotifBouton(el, court);
    } catch (err) {
      b.disabled = false;
      const m = el.querySelector("[data-notif-msg]"); if (m) m.textContent = err.message;
    }
  };
}
