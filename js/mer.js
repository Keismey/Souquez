// Souquez ! : mers et missions : carte, mission en cours, ordres appris, progression et écran de fin.
// Données dans js/donnees.js (MERS, BUTIN_MULT), textes dans js/textes.js, progression dans la sauvegarde (save.missions, save.butin, save.piece).
'use strict';
const MER = MERS[0];
const LEVEL_V1 = LEVEL.monsters.map((m) => ({ ...m })); // rencontres de la mission « Cap au large » (V1)
let MISSION = null, ORDRES = null; // mission en cours ; ordres reconnus (null = tous)

// ---------- Mission en cours ----------
function chargerMission(id) {
  const i = MER.missions.findIndex((m) => m.id === id), M = MER.missions[i];
  MISSION = M;
  setTempo(M.bpm);
  STARS.refTime = M.ref;
  if (M.boss) { LEVEL.portX = -2000; LEVEL.monsters = [{ type: 'homard', x: 500 }]; } // combat sur place : il faut vaincre le boss
  else { LEVEL.portX = M.portX; LEVEL.monsters = M.rencontres === 'V1' ? LEVEL_V1.map((m) => ({ ...m })) : M.rencontres.map(([type, x]) => ({ type, x })); }
  // Ordres appris jusqu'à cette mission comprise ; le boss : tous ceux de la mer
  ORDRES = new Set((M.boss ? MER.missions : MER.missions.slice(0, i + 1)).flatMap((m) => m.ordre || []));
  buildBook();
}
const ordreOk = (id) => !ORDRES || ORDRES.has(id);

// ---------- Progression ----------
const etoilesDe = (id) => ((save.missions[id] || {}).etoiles || 0);
// Ouverte : la première, ou si la précédente (ou une mission plus loin, ex. migration) a au moins 1 étoile
const missionOuverte = (i) => i === 0 || MER.missions.slice(i - 1).some((m) => etoilesDe(m.id) >= 1);
const prochaineMission = () => MER.missions.findIndex((m, i) => missionOuverte(i) && etoilesDe(m.id) < 1);

// ---------- Carte ----------
const ETOILE_SVG = (on) => '<svg class="etoile" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="' + (on ? '#E0A82E' : 'rgba(31,42,68,.25)') + '" stroke="#1F2A44" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const CADENAS_SVG = '<svg class="cad" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
const mmss = (s) => s == null ? t('notPlayed') : Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
function ouvrirCarte() {
  overlayStack.forEach((id) => show(id, false)); overlayStack = [];
  stopMusic(); G = null; if (ctx) ctx.resume(); renderSlots(); $('phase').textContent = ''; hint('');
  openOverlay('ovCarte'); renduCarte();
  const nx = document.querySelector('#carteZone .bouee.prochaine') || document.querySelector('#carteZone .bouee'); if (nx) nx.focus();
}
function renduCarte() {
  $('carteTitre').textContent = MER.nom[save.lang] || MER.nom.fr;
  const tot = MER.missions.reduce((a, m) => a + etoilesDe(m.id), 0), max = MER.missions.length * 3;
  $('carteTotal').innerHTML = ETOILE_SVG(true) + ' ' + tot + ' / ' + max + ' · ' + save.butin + ' ⚙' + (save.piece ? ' · ' + t('rareFound') : '');
  $('carteTotal').setAttribute('aria-label', tot + ' / ' + max + ' ★, ' + t('loot') + ' ' + save.butin + (save.piece ? ', ' + t('rareFound') : ''));
  const z = $('carteZone'), pts = MER.missions.map((m) => m.carte);
  z.querySelectorAll('.bouee, .etiq').forEach((e) => e.remove());
  $('carteRoute').innerHTML = '<path d="M' + pts.map((p) => p.join(' ')).join(' L') + '" fill="none" stroke="#F2E6CC" stroke-dasharray="2 1.6" vector-effect="non-scaling-stroke" style="stroke-width:5px"/>';
  const nx = prochaineMission(), L = save.lang;
  MER.missions.forEach((m, i) => {
    const ok = missionOuverte(i), et = etoilesDe(m.id), b = document.createElement('button');
    b.className = 'bouee' + (m.boss ? ' boss' : '') + (ok ? '' : ' ferme') + (i === nx ? ' prochaine' : '');
    b.style.left = m.carte[0] + '%'; b.style.top = m.carte[1] + '%';
    b.innerHTML = ok ? (m.boss ? '☠' : String(i + 1)) : CADENAS_SVG;
    b.setAttribute('aria-label', (m.nom[L] || m.nom.fr) + (ok ? ', ' + et + ' / 3' : ', ' + t('locked')));
    if (ok) b.onclick = () => ficheMission(m, i); else b.setAttribute('aria-disabled', 'true');
    const e = document.createElement('div'); e.className = 'etiq';
    e.style.left = m.carte[0] + '%'; e.style.top = 'calc(' + m.carte[1] + '% + ' + (m.boss ? 'clamp(36px, 9vh, 54px)' : 'clamp(29px, 7vh, 44px)') + ')';
    e.innerHTML = '<b>' + (m.nom[L] || m.nom.fr) + '</b>' + (ok ? '<span class="etoiles">' + [0, 1, 2].map((k) => ETOILE_SVG(k < et)).join('') + '</span>' : '');
    z.append(b, e);
  });
}
let ficheDe = null;
function ficheMission(m, i) {
  ficheDe = document.activeElement;
  const p = save.missions[m.id] || {}, L = save.lang, nom = m.nom[L] || m.nom.fr;
  $('fNom').textContent = (m.boss ? '' : (i + 1) + '. ') + nom;
  $('fEt').innerHTML = [0, 1, 2].map((k) => ETOILE_SVG(k < (p.etoiles || 0))).join('');
  const rows = [
    [t('goal'), m.boss ? t('bossGoal')(nom) : t('goalTxt')(m.portX, m.but)],
    [t('newOrderRow'), m.ordre.length ? m.ordre.map((o) => t('cmd' + o)).join(', ') : t('none')],
    ...(m.boss ? [[t('tempo'), m.bpm + ' BPM']] : []),
    [t('refTime'), mmss(m.ref)], [t('bestTime'), mmss(p.temps)], [t('bestHull'), p.coque == null ? t('notPlayed') : p.coque + ' / ' + SHIP.hull],
    [t('baseLoot'), m.butin + ' ⚙' + (m.piece ? t('rareFirst') : '')],
  ];
  $('fInfo').innerHTML = rows.map(([k, v]) => '<dt>' + k + '</dt><dd>' + v + '</dd>').join('');
  $('fJouer').onclick = () => { $('fiche').hidden = true; chargerMission(m.id); initAudio(); goFullscreen(); startPlay('play'); };
  $('fiche').hidden = false; $('fJouer').focus();
}
function fermerFiche() { $('fiche').hidden = true; if (ficheDe) ficheDe.focus(); }
$('fFermer').onclick = fermerFiche;
$('fiche').onclick = (e) => { if (e.target === $('fiche')) fermerFiche(); };
$('carteRetour').onclick = toTitle;
document.addEventListener('keydown', (e) => {
  if ($('fiche').hidden || $('ovCarte').hidden) return;
  if (e.key === 'Escape') fermerFiche();
  if (e.key === 'Tab') { // piège de focus dans la fiche ouverte
    const f = [...$('fiche').querySelectorAll('button')], i = f.indexOf(document.activeElement);
    e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});

// ---------- Fin de mission ----------
// Appelé par winGame() : enregistre la progression et complète l'écran de fin. 0 étoile : « Rejouer » en premier, butin ×1.
let focusFin = null;
function finMission(r) {
  if (!MISSION) return;
  const M = MISSION, et = r.stars, avant = save.missions[M.id] || {};
  const x = BUTIN_MULT[et], gain = Math.round(M.butin * x), piece = M.piece && et >= 1 && !save.piece;
  const rec = { etoiles: Math.max(avant.etoiles || 0, et) };
  const tps = et >= 1 ? Math.min(avant.temps ?? Infinity, Math.round(r.time)) : avant.temps; if (tps != null && tps !== Infinity) rec.temps = tps;
  const cq = et >= 1 ? Math.max(avant.coque ?? 0, Math.floor(G.ship.hp)) : avant.coque; if (cq != null) rec.coque = cq;
  save.missions[M.id] = rec; save.butin += gain; if (piece) save.piece = true; persist();
  const ov = $('ovWin');
  ov.querySelector('h2').textContent = et === 0 ? t('sunkTitle') : M.boss ? t('wonBoss') : t('wonMission');
  ov.querySelector('p').textContent = et === 0 ? t('sunkTxt') : M.boss ? t('wonBossTxt') : t('wonMissionTxt');
  const lignes = [t('lootGain')(gain, x)];
  if (piece) lignes.push(t('rarePart'));
  if (et >= 1 && !M.boss) for (const o of M.ordre || []) lignes.push(t('newOrder')(t('cmd' + o)));
  $('starsWhy').insertAdjacentHTML('beforeend', lignes.map((s) => '<span class="ok"><b>⚓</b>' + s + '</span>').join(''));
  const again = $('againBtn'), carte = $('titleBtn2'), row = again.parentNode;
  if (et === 0) row.prepend(again); else row.prepend(carte);
  again.classList.toggle('alt', et !== 0); carte.classList.toggle('alt', et === 0);
  focusFin = row.firstElementChild;
}
const starGoalTxt = () => !MISSION ? t('starPort') : MISSION.boss ? t('starBoss') : t('starGoal')[MISSION.but];

// ---------- But au bout de la mer (formes simples en attendant la DA) ----------
function drawGoal(fx, lit) {
  const b = MISSION ? MISSION.but : 'port', w = Math.sin(tAmb * 1.6);
  if (MISSION && MISSION.boss) return;
  cx.save();
  if (b === 'bouee') {
    cx.translate(fx, SEA + 6 + w * 3); cx.rotate(w * 0.08);
    C('#b5452f'); cx.fillRect(-14, -60, 28, 50); C('#f2e6cc'); cx.fillRect(-14, -45, 28, 12);
    C('#1f2a44'); cx.fillRect(-2, -84, 4, 26); C(lit ? mix('#e0a82e', '#ffd447', lit) : '#e0a82e'); cx.beginPath(); cx.arc(0, -86, 7, 0, 7); cx.fill();
    C('#1f2a44'); cx.beginPath(); cx.ellipse(0, -8, 24, 9, 0, 0, 7); cx.fill();
  } else if (b === 'phare') {
    cx.translate(fx, SEA);
    C('#3d4a4f'); cx.beginPath(); cx.ellipse(0, 4, 90, 22, 0, Math.PI, 0); cx.fill();
    for (let i = 0; i < 5; i++) { const y0 = -i * 36, w0 = 30 - i * 3, w1 = 30 - (i + 1) * 3; C(i % 2 ? '#f2e6cc' : '#b5452f'); cx.beginPath(); cx.moveTo(-w0, y0); cx.lineTo(w0, y0); cx.lineTo(w1, y0 - 36); cx.lineTo(-w1, y0 - 36); cx.fill(); }
    C('#1f2a44'); cx.fillRect(-22, -192, 44, 8); cx.fillRect(-16, -222, 32, 4);
    C('rgba(255,214,120,' + (0.55 + 0.45 * lit) + ')'); cx.fillRect(-14, -218, 28, 26);
    C('#1f2a44'); cx.beginPath(); cx.moveTo(-18, -222); cx.lineTo(0, -240); cx.lineTo(18, -222); cx.fill();
    const a = Math.sin(tAmb * 0.9) * 0.6;
    cx.globalAlpha = 0.18 + 0.2 * lit; C('#ffd98a'); cx.beginPath(); cx.moveTo(0, -205);
    cx.lineTo(-420 * Math.cos(a), -265 + 126 * Math.sin(a)); cx.lineTo(-420 * Math.cos(a), -145 + 126 * Math.sin(a)); cx.fill();
  } else if (b === 'epave') {
    cx.translate(fx, SEA + 16); cx.rotate(-0.18 + w * 0.02);
    C('#3a2e28'); cx.beginPath(); cx.moveTo(-110, -20); cx.lineTo(90, -46); cx.lineTo(70, 10); cx.lineTo(-90, 20); cx.fill();
    C('#5a463a'); for (let i = 0; i < 4; i++) cx.fillRect(-80 + i * 40, -30 - i * 4, 22, 6);
    C('#24425a'); cx.beginPath(); cx.arc(-10, -10, 9, 0, 7); cx.fill();
    C('#3a2e28'); cx.fillRect(10, -150, 7, 110); cx.save(); cx.translate(13, -120); cx.rotate(0.5); cx.fillRect(-40, -3, 70, 5); cx.restore();
    C(lit ? mix('#b5452f', '#ffd447', lit) : '#b5452f'); cx.beginPath(); cx.moveTo(17, -150); cx.lineTo(52, -138 + w * 4); cx.lineTo(17, -128); cx.fill();
  } else {
    cx.translate(fx, SEA);
    C('#5a463a'); cx.fillRect(-60, -18, 260, 18); C('#3a2e28'); for (let i = 0; i < 6; i++) cx.fillRect(-56 + i * 48, -18, 8, 50);
    C('#4a4a52'); cx.fillRect(20, -110, 120, 92); C('#b5452f'); cx.beginPath(); cx.moveTo(10, -110); cx.lineTo(80, -150); cx.lineTo(150, -110); cx.fill();
    C('#2a2a30'); for (let i = 0; i < 3; i++) cx.fillRect(36 + i * 34, -80, 16, 22);
    C('#f2e6cc'); cx.fillRect(-50, -90, 16, 72); C(lit ? mix('#e0a82e', '#ffd447', lit) : '#e0a82e'); cx.fillRect(-54, -102, 24, 12);
  }
  cx.restore();
}
