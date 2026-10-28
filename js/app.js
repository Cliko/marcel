// Rendu et interactions de l'appli (repris de la version artefact)
function exId(d, i) { return d.id + "-" + i; }
function dayDone(id) { const d = DAYS.find(x => x.id === id); return d.ex.every((_, i) => state.checks[exId(d, i)]); }
function questDone(q) { return q.auto ? q.auto() : !!state.quests[q.id]; }

const pad = n => String(n).padStart(2, "0");
const now = new Date();
const todayIso = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
const SHORT = ["L", "M", "M", "J", "V", "S", "D"];
// Jour affiché sur mobile : aujourd'hui pendant la semaine, sinon lundi (avant) ou dimanche (après)
let focusId = (DAYS.find(d => d.iso === todayIso) || (todayIso < DAYS[0].iso ? DAYS[0] : DAYS[DAYS.length - 1])).id;
let tab = "prog";
try { tab = localStorage.getItem(KEY + "-tab") || "prog"; } catch (e) {}

function renderDays() {
  const L = state.lvl === "I" ? 3 : 2;
  document.getElementById("daypick").innerHTML = DAYS.map((d, i) =>
    `<button type="button" id="pick-${d.id}" data-day="${d.id}" aria-pressed="${d.id === focusId}" class="${dayDone(d.id) ? "ok" : ""}${d.iso === todayIso ? " is-today" : ""}">${SHORT[i]}<i>${d.iso === todayIso ? "auj." : d.iso.slice(8)}</i></button>`).join("");
  document.getElementById("days").innerHTML = DAYS.map(d => {
    const done = d.ex.filter((_, i) => state.checks[exId(d, i)]).length;
    const full = done === d.ex.length;
    return `<section class="day${d.iso === todayIso ? " today" : ""}${d.id === focusId ? " focus" : ""}" aria-labelledby="h-${d.id}">
      <div class="day-head">
        <span class="day-date">${d.iso === todayIso ? "Aujourd'hui" : d.date}</span>
        <h3 id="h-${d.id}">${d.title}</h3>
        <span class="pill${full ? " ok" : ""}">${full ? "Séance validée · +" + d.bonus + " XP" : done + "/" + d.ex.length + " · " + d.bonus + " XP"}</span>
      </div>
      <div class="day-note">${d.note}</div>
      <table class="ex-table">
        <thead><tr><th></th><th>Exercice</th><th>Séries × reps</th><th>Repos</th></tr></thead>
        <tbody>${d.ex.map((e, i) => {
          const id = exId(d, i), on = !!state.checks[id];
          return `<tr class="${on ? "is-done" : ""}">
            <td class="chk"><input type="checkbox" id="c-${id}" data-ex="${id}" ${on ? "checked" : ""} aria-label="${e[0]} fait"></td>
            <td class="ex"><label for="c-${id}"><span class="ex-name">${e[0]}</span><span class="ex-tip">${e[1]}</span></label>${e[5] ? `<a class="ex-link" href="${imgUrl(e[5])}" target="_blank" rel="noopener">Voir des schémas ↗</a>` : ""}</td>
            <td class="num sets">${e[L]}</td>
            <td class="num">${e[4] === "—" ? "—" : "repos " + e[4]}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>
    </section>`;
  }).join("");
}

function computeXp() {
  return DAYS.reduce((s, d) => s + (dayDone(d.id) ? d.bonus : 0) + foodDayXp(d.id), 0) + QUESTS.reduce((s, q) => s + (questDone(q) ? q.xp : 0), 0);
}

function renderProgress() {
  const xp = computeXp(), pct = x => Math.min(100, x / MAX_XP * 100);
  document.getElementById("xp").innerHTML = `${xp}<small>/ ${MAX_XP} XP</small>`;
  const bar = document.getElementById("bar");
  bar.setAttribute("aria-valuenow", xp); bar.setAttribute("aria-valuemax", MAX_XP);
  bar.innerHTML = `<div class="bar-fill" style="width:${pct(xp)}%"></div>` + TIERS.map(t => `<div class="bar-tick${xp >= t.xp ? " won" : ""}" style="left:${pct(t.xp)}%"></div>`).join("");
  document.getElementById("bar-labels").innerHTML = TIERS.map(t => `<span class="${xp >= t.xp ? "won" : ""}" style="left:${pct(t.xp)}%">${t.name} ${t.xp}</span>`).join("");
  const next = TIERS.find(t => xp < t.xp);
  document.getElementById("xp-next").innerHTML = next ? `Prochain palier : <b>${next.name}</b> dans ${next.xp - xp} XP` : `<b>Palier Or atteint</b>, semaine parfaite`;

  const doneCount = QUESTS.filter(questDone).length;
  const cnt = document.getElementById("q-count");
  cnt.textContent = doneCount + "/" + QUESTS.length; cnt.className = "count" + (doneCount ? " hot" : "");
  const qItem = q => {
    const done = questDone(q);
    const box = q.auto
      ? `<input type="checkbox" id="q-${q.id}" ${done ? "checked" : ""} disabled aria-label="${q.title}, validée automatiquement">`
      : `<input type="checkbox" id="q-${q.id}" data-quest="${q.id}" ${done ? "checked" : ""}>`;
    return `<li class="quest${done ? " done" : ""}">${box}
      <label for="q-${q.id}"><span class="q-title">${q.title}</span><span class="q-desc">${q.desc}${q.auto ? ' <span class="auto-tag">· auto</span>' : ""}</span></label>
      <span class="q-xp">+${q.xp}</span></li>`;
  };
  document.getElementById("quests").innerHTML = QUESTS.filter(q => !q.food).map(qItem).join("");
  document.getElementById("quests-food").innerHTML = QUESTS.filter(q => q.food).map(qItem).join("");
  document.getElementById("tiers").innerHTML = TIERS.map(t =>
    `<div class="tier${xp >= t.xp ? " won" : ""}"><b>${t.xp} XP</b><span><strong>${t.name}</strong> · ${t.reward}${xp >= t.xp ? " ✓" : ""}</span></div>`).join("");
}

// Notifications : on compare ce qui est accompli avant et après chaque action
let achieved = null;
function snapshot() {
  const xp = computeXp();
  return new Set([
    ...QUESTS.filter(questDone).map(q => "q:" + q.id),
    ...TIERS.filter(t => xp >= t.xp).map(t => "t:" + t.name),
    ...DAYS.filter(d => dayDone(d.id)).map(d => "d:" + d.id),
    ...DAYS.filter(d => foodDayDone(d.id)).map(d => "f:" + d.id),
  ]);
}
function notifyNew() {
  const cur = snapshot();
  if (achieved) {
    cur.forEach(k => {
      if (achieved.has(k)) return;
      const [type, id] = k.split(":");
      if (type === "q") { const q = QUESTS.find(x => x.id === id); toast("Quête accomplie", `${q.title} · +${q.xp} XP`, "★"); }
      if (type === "t") { const t = TIERS.find(x => x.name === id); toast(`Palier ${t.name} atteint`, `Récompense débloquée : ${t.reward}`, t.name[0]); }
      if (type === "f") { const d = DAYS.find(x => x.id === id); toast("Journée nutrition validée", `${d.date} · +${FOOD_DAY_XP} XP`, "✓"); }
      if (type === "d") { const d = DAYS.find(x => x.id === id); toast("Séance validée", `${d.title} · +${d.bonus} XP`, "✓"); }
    });
  }
  achieved = cur;
}
function toast(title, text, mark) {
  const el = document.createElement("div");
  el.className = "toast"; el.setAttribute("role", "status");
  el.innerHTML = `<div class="medal" aria-hidden="true">${mark}</div><strong></strong><span></span>`;
  el.querySelector("strong").textContent = title; el.querySelector("span").textContent = text;
  document.getElementById("toasts").appendChild(el);
  try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) {}
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 350); }, 3800);
}

const eur = n => n.toFixed(2).replace('.', ',').replace(',00', '') + ' €';
function renderFood() {
  const d = DAYS.find(x => x.id === focusId), i = DAYS.indexOf(d);
  document.getElementById("food-pick").innerHTML = DAYS.map((x, k) =>
    `<button type="button" id="fpick-${x.id}" data-day="${x.id}" aria-pressed="${x.id === focusId}" class="${foodDayDone(x.id) ? "ok" : ""}${x.iso === todayIso ? " is-today" : ""}">${SHORT[k]}<i>${x.iso === todayIso ? "auj." : x.iso.slice(8)}</i></button>`).join("");
  const sport = d.id === "mer" || d.id === "dim";
  document.getElementById("food-day").innerHTML = `
    <div class="day-head" style="padding:0"><span class="day-date">${d.iso === todayIso ? "Aujourd'hui" : d.date}</span><h3>Ma journée</h3>
      <span class="pill${foodDayDone(d.id) ? " ok" : ""}">${foodDayXp(d.id)}/${FOOD_DAY_XP} XP</span></div>
    <ul class="checklist">${FOOD_DAILY.map(f => {
      if (f.type === "compteur") {
        const n = state.food.water[d.id] || 0;
        return `<li class="water${n >= f.max ? " done" : ""}"><div><span class="ex-name">${f.label}</span><span class="ex-tip">${sport ? f.bonus + " (jour " + (d.id === "mer" ? "vélo" : "piscine") + ")" : f.bonus}</span></div>
          <div class="glasses" role="group" aria-label="Verres d'eau bus">${Array.from({ length: f.max }, (_, k) =>
            `<button type="button" class="glass${k < n ? " full" : ""}" data-water="${k + 1}" aria-label="${k + 1} verre${k ? "s" : ""}"></button>`).join("")}<span class="num">${n}/${f.max}</span></div></li>`;
      }
      const id = d.id + "-" + f.id, on = !!state.food.daily[id];
      return `<li class="${on ? "done" : ""}"><input type="checkbox" id="f-${id}" data-food="${id}" ${on ? "checked" : ""}><label for="f-${id}" class="ex-name">${f.label}</label><span class="q-xp">+${f.xp}</span></li>`;
    }).join("")}</ul>`;
  const S = NUTRI.batch_cooking.sessions;
  document.getElementById("batch-sub").textContent = S.length + " sessions · " + S[0].parts + " parts";
  document.getElementById("batch-rule").textContent = NUTRI.batch_cooking.principe;
  document.getElementById("batch").innerHTML = NUTRI.batch_cooking.sessions.map((s, k) => {
    const on = !!state.food.batch[k];
    return `<details class="recipe${on ? " done" : ""}"${k === 0 ? " open" : ""}>
      <summary><span class="day-date">${s.jour}</span><span class="r-name">${s.recette}</span>
        <span class="r-meta">${s.parts} parts · ${s.kcal_part} kcal · ${s.proteines_part_g} g prot. · ${s.temps}</span>${s.prix_part_eur ? `<span class="r-price">≈ ${eur(s.prix_part_eur)} la part · ${eur(s.prix_total_eur)} la recette</span>` : ""}</summary>
      <div class="r-body">
        <div><div class="eyebrow">Ingrédients</div><ul>${s.ingredients.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <div><div class="eyebrow">Étapes</div><ol>${s.etapes.map(x => `<li>${x}</li>`).join("")}</ol></div>
        <div class="r-actions"><a class="ex-link" href="${s.image}" target="_blank" rel="noopener">Voir des photos ↗</a>
          <label class="r-check"><input type="checkbox" id="b-${k}" data-batch="${k}" ${on ? "checked" : ""}> Batch fait</label></div>
      </div></details>`;
  }).join("");
  const C = NUTRI.batch_cooking.liste_courses, got = C.filter((_, k) => state.food.courses[k]).length;
  document.getElementById("courses-count").textContent = got + "/" + C.length;
  const B = NUTRI.budget;
  document.getElementById("budget").innerHTML = B ? `<div class="budget-row"><span>Recettes de la semaine</span><b>≈ ${eur(B.recettes_semaine_eur)}</b></div>
    <div class="budget-row"><span>Courses totales</span><b>≈ ${eur(B.courses_totales_eur)}</b></div><p class="rules">${B.note} ${B.principe}.</p>` : "";
  document.getElementById("courses").innerHTML = C.map((x, k) =>
    `<li class="${state.food.courses[k] ? "done" : ""}"><input type="checkbox" id="s-${k}" data-course="${k}" ${state.food.courses[k] ? "checked" : ""}><label for="s-${k}">${x}</label></li>`).join("");
}
function renderLevel() { document.querySelectorAll(".level button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lvl === state.lvl))); }
function renderTab() {
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  document.getElementById("view-prog").hidden = tab !== "prog";
  document.getElementById("view-quests").hidden = tab !== "quests";
  document.getElementById("view-food").hidden = tab !== "food";
  document.getElementById("view-title").textContent = { prog: "Ta séance", quests: "Tes quêtes", food: "Ta nutrition" }[tab];
  document.querySelector(".level").hidden = tab !== "prog";
}
function renderMarcel() {
  const d = DAYS.find(x => x.iso === todayIso);
  const xp = computeXp(), next = TIERS.find(x => xp < x.xp);
  let msg;
  if (todayIso < DAYS[0].iso) msg = "Bonjour Ben ! On commence lundi avec une séance de poussée. Repose-toi bien d'ici là.";
  else if (!d) msg = "Bravo pour cette semaine, Ben. Je prépare la suivante à partir de tes résultats.";
  else if (dayDone(d.id)) msg = `Séance du jour bouclée, chapeau ! ${next ? "Plus que " + (next.xp - xp) + " XP avant le palier " + next.name + "." : "Palier Or en poche."}`;
  else msg = `Bonjour Ben ! Aujourd'hui : ${d.title.toLowerCase()}. On s'y met ?`;
  if (tab === "food") { const i = Math.max(0, DAYS.findIndex(x => x.id === focusId)); msg = "Astuce du jour : " + NUTRI.astuces_marcel[i % NUTRI.astuces_marcel.length]; }
  document.getElementById("marcel").textContent = msg;
}
function renderAll(silent) { renderLevel(); renderTab(); renderDays(); renderFood(); renderProgress(); renderMarcel(); if (silent) achieved = snapshot(); else notifyNew(); }

document.querySelector(".level").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.lvl = b.dataset.lvl; save(); renderLevel(); renderDays();
});
document.querySelector(".tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  tab = b.dataset.tab; try { localStorage.setItem(KEY + "-tab", tab); } catch (err) {} renderTab(); renderMarcel(); window.scrollTo(0, 0);
});
document.getElementById("daypick").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  focusId = b.dataset.day; renderDays(); renderFood(); document.getElementById("pick-" + focusId)?.focus();
});
document.getElementById("days").addEventListener("change", e => {
  const id = e.target.dataset.ex; if (!id) return;
  state.checks[id] = e.target.checked; save(); renderDays(); renderProgress(); renderMarcel(); notifyNew();
  document.getElementById("c-" + id)?.focus();
});
document.getElementById("view-quests").addEventListener("change", e => {
  const id = e.target.dataset.quest; if (!id) return;
  state.quests[id] = e.target.checked; save(); renderProgress(); notifyNew();
  document.getElementById("q-" + id)?.focus();
});
["push", "pull", "plank"].forEach(k => {
  const el = document.getElementById("rec-" + k);
  el.value = state.records[k] || "";
  el.addEventListener("input", () => { state.records[k] = el.value; save(); renderProgress(); notifyNew(); });
});
document.getElementById("view-food").addEventListener("click", e => {
  const pick = e.target.closest("[data-day]");
  if (pick) { focusId = pick.dataset.day; renderFood(); renderDays(); renderMarcel(); document.getElementById("fpick-" + focusId)?.focus(); return; }
  const w = e.target.closest("[data-water]");
  if (w) { const n = +w.dataset.water, cur = state.food.water[focusId] || 0; state.food.water[focusId] = cur === n ? n - 1 : n; afterFood(); document.querySelector(`[data-water="${n}"]`)?.focus(); }
});
document.getElementById("view-food").addEventListener("change", e => {
  const el = e.target, ds = el.dataset;
  if (ds.food) state.food.daily[ds.food] = el.checked;
  else if (ds.batch) state.food.batch[ds.batch] = el.checked;
  else if (ds.course) state.food.courses[ds.course] = el.checked;
  else return;
  const openIdx = [...document.querySelectorAll("#batch details")].map(x => x.open);
  afterFood();
  document.querySelectorAll("#batch details").forEach((x, k) => x.open = openIdx[k]);
  document.getElementById(el.id)?.focus();
});
function afterFood() { save(); renderFood(); renderProgress(); notifyNew(); }
const resetBtn = document.getElementById("reset");
let armed = false;
resetBtn.addEventListener("click", () => {
  if (!armed) { armed = true; resetBtn.textContent = "Confirmer la remise à zéro"; resetBtn.classList.add("warn");
    setTimeout(() => { armed = false; resetBtn.textContent = "Remettre à zéro"; resetBtn.classList.remove("warn"); }, 4000); return; }
  state = { lvl: state.lvl, checks: {}, quests: {}, records: {}, food: emptyFood() }; save(); renderFood();
  ["push", "pull", "plank"].forEach(k => document.getElementById("rec-" + k).value = "");
  armed = false; resetBtn.textContent = "Remettre à zéro"; resetBtn.classList.remove("warn"); renderAll(true);
});
document.getElementById("plate-rule").textContent = NUTRI.regle_assiette;
document.getElementById("week-label").textContent = WEEK_LABEL;
renderAll(true);
startSync();
