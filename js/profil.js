// Questionnaires (sport, nutrition), onglet Profil et espace admin (création des profils, envoi du lien de connexion).
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const Q_DEF = { sport: Q_SPORT, nutrition: Q_NUTRI };
const Q_TITRE = { sport: "Ton profil sportif", nutrition: "Ton profil nutrition" };
const Q_INTRO = {
  sport: "Quelques questions pour que Marcel prépare des séances à ta mesure. Tu pourras tout changer plus tard dans l'onglet Profil.",
  nutrition: "Maintenant la nutrition : Marcel s'en sert pour tes recettes du vendredi et ta liste de courses. Les allergies sont toujours respectées.",
};

// Ouvre un questionnaire en plein écran ; résout avec le profil mis à jour une fois enregistré
function ouvrirQuestionnaire(kind, p, premiere) {
  const box = document.getElementById("quiz"), qs = Q_DEF[kind];
  const rep = JSON.parse(JSON.stringify(p[kind] || {}));
  if (kind === "sport" && !rep.fixes) rep.fixes = [];
  return new Promise(resolve => {
    const chips = (q, v) => (q.type === "days" ? JOURS : q.options).map(([val, lab]) => {
      const on = q.type === "one" ? v === val : (v || []).includes(val);
      return `<button type="button" class="chip" data-q="${q.id}" data-v="${esc(JSON.stringify(val))}" aria-pressed="${on}">${esc(lab)}</button>`;
    }).join("");
    const champ = q => {
      const v = rep[q.id], req = Q_REQUIS[kind].includes(q.id) ? ' <span class="req">obligatoire</span>' : "";
      if (q.type === "text") return `<label class="q-field"><span class="q-label">${esc(q.label)}</span><input type="text" data-text="${q.id}" value="${esc(v || "")}" placeholder="${esc(q.placeholder || "")}"></label>`;
      if (q.type === "fixes") return `<div class="q-field"><span class="q-label">${esc(q.label)}</span><div class="fixes">${(v || []).map((f, i) =>
        `<div class="fixe"><input type="text" data-fixe="${i}" value="${esc(f.activite)}" placeholder="Activité" aria-label="Activité">
          <select data-fixejour="${i}" aria-label="Jour">${JOURS.map(([id, c]) => `<option value="${id}"${f.jour === id ? " selected" : ""}>${c}</option>`).join("")}</select>
          <button type="button" class="linkbtn" data-fixedel="${i}">Retirer</button></div>`).join("")}
        <button type="button" class="linkbtn" data-fixeadd="1">+ Ajouter une activité fixe</button></div></div>`;
      return `<div class="q-field" role="group" aria-label="${esc(q.label)}"><span class="q-label">${esc(q.label)}${req}</span><div class="chips">${chips(q, v)}</div></div>`;
    };
    const render = () => {
      box.innerHTML = `<form class="quiz-card" id="quiz-form">
        <div class="coach"><div class="avatar" aria-hidden="true"><img src="icons/icon-192.png" alt=""></div>
          <div><div class="coach-name">${premiere ? "Bienvenue " + esc(p.prenom) + " !" : "Marcel"}</div><div class="eyebrow">${Q_TITRE[kind]}</div></div></div>
        <p class="rules">${Q_INTRO[kind]}</p>
        ${qs.map(champ).join("")}
        <p class="rules" id="quiz-msg" role="status"></p>
        <div class="quiz-actions">${premiere ? "" : `<button type="button" class="linkbtn" id="quiz-cancel">Annuler</button>`}<button class="primary" type="submit" id="quiz-ok">Enregistrer</button></div>
      </form>`;
    };
    const syncTexts = () => {
      box.querySelectorAll("[data-text]").forEach(i => rep[i.dataset.text] = i.value.trim());
      box.querySelectorAll("[data-fixe]").forEach(i => rep.fixes[+i.dataset.fixe].activite = i.value.trim());
      box.querySelectorAll("[data-fixejour]").forEach(s => rep.fixes[+s.dataset.fixejour].jour = s.value);
    };
    render(); box.hidden = false; document.body.classList.add("locked"); box.scrollTop = 0;
    box.onclick = e => {
      const c = e.target.closest(".chip");
      if (c) {
        const q = qs.find(x => x.id === c.dataset.q), val = JSON.parse(c.dataset.v);
        if (q.type === "one") rep[q.id] = rep[q.id] === val ? null : val;
        else { const l = rep[q.id] || []; rep[q.id] = l.includes(val) ? l.filter(x => x !== val) : [...l, val]; }
        box.querySelectorAll(`.chip[data-q="${q.id}"]`).forEach(b => {
          const v = JSON.parse(b.dataset.v); b.setAttribute("aria-pressed", String(q.type === "one" ? rep[q.id] === v : rep[q.id].includes(v)));
        });
        return;
      }
      if (e.target.closest("[data-fixeadd]")) { syncTexts(); rep.fixes.push({ activite: "", jour: "mer" }); render(); return; }
      const del = e.target.closest("[data-fixedel]");
      if (del) { syncTexts(); rep.fixes.splice(+del.dataset.fixedel, 1); render(); return; }
      if (e.target.id === "quiz-cancel") { fermer(); resolve(p); }
    };
    const fermer = () => { box.hidden = true; box.innerHTML = ""; document.body.classList.remove("locked"); };
    box.onsubmit = async e => {
      e.preventDefault(); syncTexts();
      if (rep.fixes) rep.fixes = rep.fixes.filter(f => f.activite);
      const vide = Q_REQUIS[kind].filter(k => rep[k] == null || rep[k] === "" || (Array.isArray(rep[k]) && !rep[k].length));
      const msg = document.getElementById("quiz-msg");
      if (vide.length) { msg.textContent = "Il manque : " + vide.map(k => qs.find(q => q.id === k).label.toLowerCase()).join(", ") + "."; return; }
      document.getElementById("quiz-ok").disabled = true;
      const { data, error } = await sb.from("profiles").update({ [kind]: rep, [kind + "_maj"]: new Date().toISOString() }).eq("id", p.id).select().single();
      if (error) { msg.textContent = "Enregistrement impossible, vérifie ta connexion et réessaie."; document.getElementById("quiz-ok").disabled = false; return; }
      fermer(); resolve(data);
    };
  });
}

// Résumé lisible des réponses
function resume(kind, rep) {
  if (!rep) return `<p class="rules">Pas encore rempli.</p>`;
  const lab = (q, v) => q.type === "days" ? (v || []).map(id => JOURS.find(j => j[0] === id)[1]).join(", ")
    : q.type === "fixes" ? (v || []).map(f => f.activite + " (" + JOURS.find(j => j[0] === f.jour)[1].toLowerCase() + ")").join(", ")
    : q.type === "text" ? v : q.type === "one" ? (q.options.find(o => o[0] === v) || [, ""])[1] : (v || []).map(x => (q.options.find(o => o[0] === x) || [, x])[1]).join(", ");
  return `<dl class="resume">${Q_DEF[kind].map(q => { const t = lab(q, rep[q.id]); return t ? `<dt>${esc(q.label)}</dt><dd>${esc(t)}</dd>` : ""; }).join("")}</dl>`;
}

function renderProfil() {
  const v = document.getElementById("view-profil"), p = PROFIL;
  v.innerHTML = `<div class="stack">
    <div class="panel"><div class="subhead"><h2>${esc(p.prenom)}</h2><span class="eyebrow">${esc(p.email)}</span></div>
      <p class="rules">Tes changements s'appliquent au programme du dimanche soir et aux recettes du vendredi matin.</p>
      <div class="foot"><span></span><button class="linkbtn" id="logout" type="button">Se déconnecter</button></div></div>
    <div class="panel"><div class="subhead"><h2>Notifications</h2></div><div id="notif-profil"></div></div>
    <div class="panel"><div class="subhead"><h2>Sport</h2><button class="linkbtn" type="button" data-edit="sport">Modifier</button></div>${resume("sport", p.sport)}</div>
    <div class="panel"><div class="subhead"><h2>Nutrition</h2><button class="linkbtn" type="button" data-edit="nutrition">Modifier</button></div>${resume("nutrition", p.nutrition)}</div>
    ${p.role === "admin" ? `<div class="panel" id="admin"><div class="subhead"><h2>Admin</h2><span class="eyebrow">profils</span></div><div id="admin-body"><p class="rules">Chargement…</p></div></div>` : ""}
  </div>`;
  renderNotifBouton(document.getElementById("notif-profil"), false);
  if (p.role === "admin") renderAdmin();
}
document.getElementById("view-profil").addEventListener("click", async e => {
  if (e.target.id === "logout") { deconnexion(); return; }
  const ed = e.target.closest("[data-edit]");
  if (ed) {
    const kind = ed.dataset.edit, avant = JSON.stringify(PROFIL[kind]);
    const p = await ouvrirQuestionnaire(kind, PROFIL, false);
    if (JSON.stringify(p[kind]) === avant) return;
    window.PROFIL = p; profil = p;
    // Programme de démarrage : on le reconstruit tout de suite avec les nouvelles réponses
    try { localStorage.removeItem("marcel-contenu"); } catch (err) {}
    if ((kind === "sport" && window.PROG_DEMARRAGE) || (kind === "nutrition" && NUTRI.demarrage)) location.reload();
    else { renderProfil(); toast("Profil enregistré", "Marcel en tiendra compte " + (kind === "sport" ? "dimanche soir" : "vendredi matin"), "✓"); }
    return;
  }
  const a = e.target.closest("[data-admin]");
  if (a) adminAction(a.dataset.admin, a.dataset.id, a);
});

// Espace admin
let adminProfils = [];
const dateCourte = t => t ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
function etat(x) {
  if (!x.actif) return "Désactivé";
  if (!x.user_id) return "À inviter dans Supabase";
  if (!x.sport_maj || !x.nutrition_maj) return "Connecté, questionnaire à finir";
  return "Prêt" + (x.vu_le ? " · vu le " + dateCourte(x.vu_le) : "");
}
async function renderAdmin(msg) {
  const body = document.getElementById("admin-body"); if (!body) return;
  const { data, error } = await sb.from("profiles").select("id,prenom,email,role,actif,user_id,sport_maj,nutrition_maj,lien_envoye_le,vu_le").order("created_at");
  if (error) { body.innerHTML = `<p class="rules">Impossible de charger les profils (hors ligne ?).</p>`; return; }
  adminProfils = data;
  body.innerHTML = `<ul class="checklist admin-list">${data.map(x => `<li class="${x.actif ? "" : "off"}"><div><span class="ex-name">${esc(x.prenom)}${x.role === "admin" ? ' <span class="auto-tag">· admin</span>' : ""}</span>
      <span class="ex-tip">${esc(x.email)} · ${esc(etat(x))}</span></div>
      ${x.id === PROFIL.id ? "" : `<span class="admin-btns">${x.actif && x.user_id ? `<button type="button" class="linkbtn" data-admin="lien" data-id="${x.id}">Renvoyer un lien</button>` : ""}
        <button type="button" class="linkbtn" data-admin="${x.actif ? "off" : "on"}" data-id="${x.id}">${x.actif ? "Désactiver" : "Réactiver"}</button></span>`}</li>`).join("")}</ul>
    <form class="admin-new" id="admin-new"><div class="eyebrow">Nouveau profil</div>
      <input type="text" id="new-prenom" placeholder="Prénom" aria-label="Prénom" required>
      <input type="email" id="new-email" placeholder="E-mail" aria-label="E-mail" required>
      <button class="primary" type="submit">Créer le profil</button>
      <p class="rules" id="admin-msg" role="status">${msg || "Crée d'abord le profil ici, puis invite la personne depuis Supabase : elle reçoit son lien et remplit ses questionnaires à la première ouverture."}</p>
      <a class="ex-link" href="${SUPABASE_USERS}" target="_blank" rel="noopener">Inviter dans Supabase (Users > Invite user) ↗</a></form>`;
  document.getElementById("admin-new").onsubmit = async e => {
    e.preventDefault();
    const prenom = document.getElementById("new-prenom").value.trim(), email = document.getElementById("new-email").value.trim().toLowerCase();
    const out = document.getElementById("admin-msg");
    const { data: cree, error: err } = await sb.from("profiles").insert({ prenom, email }).select().single();
    if (err) { out.textContent = err.code === "23505" ? "Cette adresse a déjà un profil." : "Création impossible : " + err.message; return; }
    renderAdmin(`Profil de ${esc(cree.prenom)} créé. Invite maintenant <b>${esc(cree.email)}</b> dans Supabase : Authentication > Users > Invite user.`);
  };
}
async function lien(x) {
  const { error } = await envoyerLien(x.email);
  if (error) return "Profil enregistré, mais l'envoi du lien a échoué : " + messageLien(error);
  await sb.from("profiles").update({ lien_envoye_le: new Date().toISOString() }).eq("id", x.id);
  return "Lien envoyé à " + x.email + ".";
}
async function adminAction(act, id, btn) {
  const x = adminProfils.find(p => p.id === id); if (!x) return;
  btn.disabled = true;
  if (act === "lien") { renderAdmin(esc(await lien(x))); return; }
  const { error } = await sb.from("profiles").update({ actif: act === "on" }).eq("id", id);
  renderAdmin(esc(error ? "Modification impossible : " + error.message : x.prenom + (act === "on" ? " est réactivé." : " est désactivé.")));
}
