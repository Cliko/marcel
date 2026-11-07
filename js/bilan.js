// Bilan de la semaine (onglet Séance, à partir du samedi) :
// 1. résumé automatique de la semaine, 2. ressenti en quelques taps, 3. propositions de Marcel à accepter ou refuser.
// Marcel écrit ses propositions le samedi soir dans le programme de la semaine (programs.data.bilan) ;
// les réponses restent dans la progression (progress.data.bilan) et la génération du dimanche soir les applique.
// Chargé avant js/app.js : les fonctions sont appelées par app.js une fois le contenu installé.

const AVIS = [["facile", "Trop facile"], ["bien", "Bien"], ["dur", "Trop dur"]];
const FORMES = [["epuise", "Épuisé"], ["fatigue", "Fatigué"], ["bien", "Bien"], ["forme", "En forme"]];
const DOULEURS = [["epaules", "Épaules"], ["poignets", "Poignets"], ["coudes", "Coudes"], ["dos", "Dos"], ["genoux", "Genoux"], ["chevilles", "Chevilles"], ["autre", "Autre"]];
const SEMAINES = [["normale", "Normale"], ["chargee", "Chargée (moins de temps)"], ["libre", "Plus libre"]];
const escB = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Quête « Bilan fait » : forme renseignée et toutes les propositions de Marcel tranchées
function bilanFait() {
  const b = state.bilan || {};
  if (!b.forme) return false;
  return !BILAN || BILAN.propositions.every(p => typeof (b.rep || {})[p.id] === "boolean");
}
// Le bilan s'ouvre le samedi (ou dès que Marcel a écrit ses propositions)
function bilanOuvert() { return !!BILAN || (DAYS[5] && todayIso >= DAYS[5].iso); }

function seg(name, list, cur, key) {
  return `<div class="seg bilan-seg" role="group" aria-label="${name}">${list.map(([v, l]) =>
    `<button type="button" id="b-${key}-${v}" data-bilan="${key}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
}

// Ligne « C'était comment ? » sous une séance validée (appelée par renderDays)
function avisSeance(d) {
  const cur = (state.bilan.avis || {})[d.id];
  return `<div class="avis"><span class="alt-q">C'était comment ?</span>${AVIS.map(([v, l]) =>
    `<button type="button" class="chip" id="avis-${d.id}-${v}" data-avis="${d.id}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
}

function resumeSemaine() {
  const passes = DAYS.filter(d => d.iso <= todayIso);
  const seances = TRAINING.filter(dayDone).length;
  const planB = DAYS.filter(d => bassOf(d.id)).length;
  // Exercices restés décochés dans une séance commencée (sans plan B)
  const sautes = [];
  DAYS.forEach(d => {
    if (bassOf(d.id) || !d.ex.length) return;
    const faits = d.ex.filter((_, i) => state.checks[exId(d, i)]);
    if (!faits.length || faits.length === d.ex.length) return;
    d.ex.forEach((e, i) => { if (!state.checks[exId(d, i)]) sautes.push(e[0] + " (" + d.date.split(" ")[0].toLowerCase() + ")"); });
  });
  const manques = passes.filter(d => TRAINING.includes(d.id) && !dayDone(d.id)).map(d => d.date.split(" ")[0].toLowerCase());
  const avis = Object.values(state.bilan.avis || {});
  const cpt = v => avis.filter(a => a === v).length;
  const lignes = [
    `<li><b>${seances}/${TRAINING.length}</b> séances validées${manques.length ? ` · manquées : ${manques.join(", ")}` : ""}</li>`,
    planB ? `<li><b>${planB}</b> ${planB > 1 ? "séances remplacées" : "séance remplacée"} par ton plan B (${escB((PLANB && PLANB.court) || "plan B").toLowerCase()})</li>` : "",
    sautes.length ? `<li>Exercices sautés : ${escB(sautes.join(", "))}</li>` : "",
    avis.length ? `<li>Ton avis : ${AVIS.filter(([v]) => cpt(v)).map(([v, l]) => cpt(v) + " × " + l.toLowerCase()).join(", ")}</li>` : "",
    `<li>Niveau : ${state.lvl === "I" ? "intermédiaire" : "débutant"} · quêtes sport : ${QUESTS.filter(q => !q.food && questDone(q)).length}/${QUESTS.filter(q => !q.food).length}</li>`,
  ];
  return `<ul class="bilan-list">${lignes.join("")}</ul>`;
}

let bilanDeplie = false;
function renderBilan() {
  const box = document.getElementById("bilan");
  if (!box) return;
  // Changements annoncés par Marcel pour la semaine (ouverts en début de semaine)
  const ch = document.getElementById("changements");
  ch.hidden = !CHANGEMENTS.length;
  if (CHANGEMENTS.length) ch.innerHTML = `<details class="panel next"${todayIso <= DAYS[1].iso ? " open" : ""}><summary class="subhead"><h2>Ce qui change</h2><span class="eyebrow">cette semaine ▾</span></summary>
    <ul class="bilan-list">${CHANGEMENTS.map(c => `<li>${escB(c)}</li>`).join("")}</ul></details>`;

  box.hidden = !bilanOuvert();
  if (box.hidden) return;
  const b = state.bilan, rep = b.rep || {};
  const douleur = b.douleur || []; // null = pas encore répondu, [] = aucune douleur
  const props = BILAN ? BILAN.propositions : [];
  const nbRep = props.filter(p => typeof rep[p.id] === "boolean").length;
  // Replié par défaut pour laisser la séance du jour visible ; le résumé dit ce qui reste à faire
  const etat = bilanFait() ? "Fait, merci !" : BILAN ? (props.length ? `Propositions de Marcel à valider (${nbRep}/${props.length})` : "Ton ressenti, en 1 minute")
    : "Ton ressenti, en 1 minute, avant samedi 20 h";
  box.innerHTML = `<details id="bilan-d"${bilanDeplie ? " open" : ""}><summary><div class="subhead"><h2>Bilan de la semaine</h2><span class="pill${bilanFait() ? " ok" : ""}">${bilanFait() ? "Fait · +30 XP" : "+30 XP"}</span></div>
    <span class="bilan-etat">${etat} <b aria-hidden="true">${bilanDeplie ? "▴" : "▾"}</b></span></summary><div class="bilan-corps">
    ${resumeSemaine()}
    <div class="bilan-q"><div class="q-label">Ta forme cette semaine</div>${seg("Forme", FORMES, b.forme, "forme")}</div>
    <div class="bilan-q"><div class="q-label">Une douleur ou une gêne ?</div><div class="chips">
      <button type="button" class="chip" id="dl-non" data-douleur="non" aria-pressed="${Array.isArray(b.douleur) && !b.douleur.length}">Non</button>
      ${DOULEURS.map(([v, l]) => `<button type="button" class="chip" id="dl-${v}" data-douleur="${v}" aria-pressed="${douleur.includes(v)}">${l}</button>`).join("")}</div></div>
    <div class="bilan-q"><div class="q-label">La semaine prochaine</div>${seg("Semaine prochaine", SEMAINES, b.semaine, "semaine")}</div>
    <div class="bilan-q"><label class="q-label" for="bilan-remarque">Une envie, une remarque pour Marcel ?</label>
      <textarea id="bilan-remarque" rows="2" placeholder="ex. plus de natation, moins de burpees…">${escB(b.remarque)}</textarea></div>
    <div class="bilan-props">
      <div class="subhead"><h3>Propositions de Marcel</h3>${props.length ? `<span class="count${nbRep === props.length ? " hot" : ""}">${nbRep}/${props.length}</span>` : ""}</div>
      ${BILAN ? `${BILAN.intro ? `<p class="rules">${escB(BILAN.intro)}</p>` : ""}${props.length ? props.map(p => {
        const r = rep[p.id];
        return `<div class="prop${r === true ? " oui" : r === false ? " non" : ""}"><div><span class="ex-name">${escB(p.titre)}</span>${p.pourquoi ? `<span class="ex-tip">${escB(p.pourquoi)}</span>` : ""}</div>
          <div class="seg prop-seg" role="group" aria-label="${escB(p.titre)}">
            <button type="button" id="prop-${escB(p.id)}-oui" data-prop="${escB(p.id)}" data-v="oui" aria-pressed="${r === true}">Accepter</button>
            <button type="button" id="prop-${escB(p.id)}-non" data-prop="${escB(p.id)}" data-v="non" aria-pressed="${r === false}">Refuser</button></div></div>`;
      }).join("") : `<p class="rules">Rien à changer : on garde le cap.</p>`}
      <p class="rules">Tu peux changer d'avis jusqu'à dimanche 19 h 30 : Marcel prépare ta semaine juste après, avec ce que tu as accepté.</p>`
      : `<p class="rules">Marcel les écrit samedi vers 20 h à partir de tes séances et de ton ressenti : réponds aux questions avant. Tu les accepteras ou refuseras ici.</p>
        <div id="bilan-notif"></div>`}
    </div></div></details>`;
  if (!BILAN) renderNotifBouton(document.getElementById("bilan-notif"), true);
}

function apresBilan(focusSel) {
  save(); renderBilan(); renderProgress(); renderMarcel(); notifyNew();
  if (focusSel) document.getElementById(focusSel)?.focus();
}
function initBilan() {
  const box = document.getElementById("bilan");
  box.addEventListener("click", e => {
    const b = state.bilan, t = e.target.closest("button"); if (!t) return;
    if (t.dataset.bilan) { const k = t.dataset.bilan; b[k] = b[k] === t.dataset.v ? null : t.dataset.v; return apresBilan(t.id); }
    if (t.dataset.douleur) {
      const v = t.dataset.douleur;
      if (v === "non") b.douleur = [];
      else b.douleur = (b.douleur || []).includes(v) ? b.douleur.filter(x => x !== v) : [...(b.douleur || []), v];
      return apresBilan(t.id);
    }
    if (t.dataset.prop) {
      const id = t.dataset.prop, v = t.dataset.v === "oui";
      b.rep = b.rep || {}; b.rep[id] = b.rep[id] === v ? null : v;
      return apresBilan(t.id);
    }
  });
  box.addEventListener("toggle", e => { if (e.target.id === "bilan-d") { bilanDeplie = e.target.open; const f = box.querySelector(".bilan-etat b"); if (f) f.textContent = bilanDeplie ? "▴" : "▾"; } }, true);
  box.addEventListener("input", e => { if (e.target.id === "bilan-remarque") { state.bilan.remarque = e.target.value; save(); } });
  document.getElementById("days").addEventListener("click", e => {
    const t = e.target.closest("[data-avis]"); if (!t) return;
    const a = state.bilan.avis = state.bilan.avis || {}, id = t.dataset.avis;
    a[id] = a[id] === t.dataset.v ? null : t.dataset.v;
    save(); renderDays(); renderBilan(); document.getElementById(t.id)?.focus();
  });
  // Ouverture depuis la notification : onglet Séance, bilan à l'écran
  if (/[?&]bilan\b/.test(location.search)) {
    history.replaceState(null, "", location.pathname);
    tab = "prog"; bilanDeplie = true; renderTab(); renderMarcel();
    setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }
}
