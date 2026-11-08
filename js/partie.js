// Souquez ! : logique de partie (rythme, ordres, monstres, équipage).
'use strict';
// ---------- Partie ----------
// Principe : chaque tape est rangée dans le temps le plus proche (la case allumée).
// Le timing ne fait jamais rater une commande : il donne seulement Parfait / Bien / Tôt / Tard
// et la puissance. Seules une mauvaise touche, une note manquante ou une tape sur un silence font rater.
let G = null;
const beatTime = (k) => G.start + k * SPB;
const isPlayer = (m) => (G && G.mode === 'calib') ? (m >= 1 && m <= 3) : (m >= 1 && m % 2 === 1);
function newGame(mode) {
  initAudio();
  // Histoire : l'intro de la mer 1 passe avant la toute première partie (une seule fois)
  if ((mode || 'play') === 'play' && !sceneSeen('mer1_intro')) { stopMusic(); G = null; renderSlots(); $('phase').textContent = ''; $('phase').classList.remove('go'); hint(''); updateCombo(); playScene('mer1_intro', () => newGame(mode)); return; }
  G = {
    mode: mode || 'play', start: ctx.currentTime + 0.8, lastSched: -1, lastVis: -1, slots: {}, evaluated: new Set(), cmds: {}, quality: {},
    combo: 0, best: 0, stats: { p: 0, g: 0, o: 0 }, power: 0, sunk: false, ship: { x: 140, tx: 140, hp: SHIP.hull, wheel: 0, recoil: [0, 0], hurt: 0 }, cam: null, calTaps: [],
    mons: LEVEL.monsters.map(m => { const T = MONSTERS[m.type]; return { ...T, ...m, max: T.hp, shake: 0, fade: 1, nextAtk: null, tele: 0, raise: 0 }; }),
    shots: [], puffs: [], fx: [], crew: newCrew(), pulse: 0, won: false, paused: false, shake: 0, totemLit: 0, curMeasure: 0, curBeat: 0, ownSlot: -1,
    phrase: null, failUntil: -1, playFrom: 4, countBeats: 4, resp: null, gridK: 4, lastRespEnd: -99, kOwn: 0, sig: '', hintHold: -1,
  };
  stopMusic(); if (G.mode === 'play') startMusic(0);
  hint(G.mode === 'calib' ? t('calGo') : ''); renderSlots(); updateCombo();
}
function updateCombo() {
  const n = G ? G.power : 0, box = $('combo');
  box.querySelectorAll('.pip').forEach((p, i) => p.classList.toggle('on', i < n));
  box.classList.toggle('full', n >= POWER.steps);
}
// Pleine puissance : +1 cran par commande réussie, −1 par raté ou rythme cassé (jamais de remise à zéro)
// Erreur : perd POWER.penalty crans, ou tout si penalty vaut 0
const powerLoss = () => -(POWER.penalty > 0 ? POWER.penalty : POWER.steps);
function powerStep(d) {
  const was = G.power; G.power = clamp(G.power + d, 0, POWER.steps);
  updateCombo();
  if (G.power === POWER.steps && was < POWER.steps) { cheer(ctx.currentTime + 0.1, false); return true; }
  return false;
}
const powerMult = () => (G.resp && G.resp.full ? POWER.mult : 1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function onPad(pad, perfMs, el) {
  if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 90); }
  if (!G || G.paused || G.won || overlayStack.length) return;
  initAudio(); vibrate(12);
  playPad(pad, ctx.currentTime, 1, 1);
  const raw = audibleAt(perfMs);
  if (G.mode === 'calib') {
    const k = Math.round((raw - G.start) / SPB);
    if (k >= 4 && k < CAL_END) { G.calTaps.push(raw - beatTime(k)); const S = G.slots[Math.floor(k / 4)] || (G.slots[Math.floor(k / 4)] = [null, null, null, null]); S[k % 4] = { pad, j: 'g' }; renderSlots(); }
    return;
  }
  checkEvaluate(raw);
  const off = save.offset ?? 0.05;
  const ta = raw - off;
  const k = Math.round((ta - G.start) / SPB);
  if (k < G.playFrom) return; // décompte
  if (k <= G.failUntil) return; // fin de l'ordre raté : pas de nouvelle commande (une erreur = une pénalité)
  if (inResp(k)) { hint(t('listenHint')); G.hintHold = k + 3; return; }
  // Départ libre : la première tape ouvre une commande de 4 temps sur ce temps-là
  if (!G.phrase || G.phrase.done) { G.phrase = { k0: k, S: [null, null, null, null], done: false }; G.gridK = k; }
  const slot = k - G.phrase.k0;
  if (slot < 0 || slot > 3) return;
  const d = ta - beatTime(k);
  const P = save.assist ? 0.12 : 0.08, Gd = save.assist ? 0.22 : 0.16;
  let j = Math.abs(d) <= P ? 'p' : Math.abs(d) <= Gd ? 'g' : (d < 0 ? 'e' : 'l');
  const S = G.phrase.S;
  if (S[slot]) j = 'x';
  S[slot] = { pad, j };
  G.stats[j === 'p' ? 'p' : j === 'g' ? 'g' : 'o']++;
  // Réglage automatique : on rapproche doucement le décalage de la façon de taper du joueur
  if (j !== 'x' && Math.abs(d) < 0.25) save.offset = clamp(off + d * 0.2, -0.1, 0.45);
  // Erreur visible tout de suite : plus aucune commande ne commence comme ça
  if (!Object.values(COMMANDS).some(c => prefixOk(c.seq, S, slot))) evaluate();
  renderSlots();
}
const inResp = (k) => !!(G.resp && k >= G.resp.k0 && k < G.resp.k0 + 4);
function prefixOk(seq, S, upto) {
  for (let i = 0; i <= upto; i++) { if (seq[i] ? !(S[i] && S[i].pad === seq[i] && S[i].j !== 'x') : S[i]) return false; }
  return true;
}
function evaluate() {
  const ph = G.phrase; if (!ph || ph.done) return; ph.done = true;
  persist();
  const S = ph.S;
  let found = null;
  for (const [id, c] of Object.entries(COMMANDS)) if (prefixOk(c.seq, S, 3)) { found = id; break; }
  if (found) {
    const notes = COMMANDS[found].seq.filter(Boolean).length;
    const q = S.filter(x => x && x.j === 'p').length / notes;
    const chained = ph.k0 === G.lastRespEnd;
    G.combo = chained ? G.combo + 1 : 1; G.best = Math.max(G.best, G.combo);
    const reached = powerStep(1);
    G.resp = { cmd: found, k0: ph.k0 + 4, q, full: G.power >= POWER.steps };
    orderCrew(found);
    G.lastRespEnd = ph.k0 + 8; G.gridK = ph.k0 + 8;
    banner(reached ? t('fullPower') : t('cmd' + found));
    // L'armée rechante la commande pendant les 4 temps suivants (notes déjà passées ignorées)
    const seq = COMMANDS[found].seq;
    for (let b = 0; b < 4; b++) { const at = beatTime(ph.k0 + 4 + b); if (seq[b] && at > ctx.currentTime - 0.02) { const t2 = Math.max(at, ctx.currentTime); playPad(seq[b], t2, 0.3, 1.5); chant(seq[b], t2); } }
    if (G.combo > 0 && G.combo % 4 === 0) cheer(beatTime(ph.k0 + 8) - SPB * 0.5, false);
  } else {
    G.combo = 0; G.lastRespEnd = -99; G.failUntil = ph.k0 + 3; powerStep(powerLoss());
    banner(t('fail'), true); groan(ctx.currentTime + 0.05);
    hint(t('failHint')); G.hintHold = ph.k0 + 8;
  }
  updateCombo();
}
function schedule() {
  if (!G || G.paused || G.won || !ctx) return;
  const ahead = ctx.currentTime + 0.12;
  while (beatTime(G.lastSched + 1) < ahead) {
    const k = ++G.lastSched, b = k % 4;
    // En partie, toujours le même tic (on démarre sur n'importe quel temps), et seulement si on le veut ou sans musique
    // Décompte (départ et reprise) : toujours audible, accent sur le premier temps
    const count = G.mode === 'play' && k < G.playFrom && k >= G.playFrom - 4;
    if (G.mode === 'calib' || save.tick || !musicBuf || count) tick(beatTime(k), (G.mode === 'calib' && b === 0) || (count && k === G.playFrom - 4));
  }
}
setInterval(schedule, 25);
// Évaluation en temps « entendu » : on attend la fin de la fenêtre du dernier temps, quelle que soit la latence du téléphone
function checkEvaluate(now) {
  if (G.mode === 'calib') return;
  const ph = G.phrase; if (!ph || ph.done) return;
  const off = save.offset ?? 0.05;
  if ((now - off - G.start) / SPB >= ph.k0 + 3.5) evaluate();
}
function finishCalibGame() {
  const v = G.calTaps.slice().sort((a, b) => a - b);
  if (v.length < 6) { banner(t('calFail'), true); newGame('calib'); return; }
  save.offset = clamp(v[Math.floor(v.length / 2)], -0.1, 0.45); persist(); refreshOpts();
  banner(t('calDone')(Math.round(save.offset * 1000)));
  setTimeout(() => newGame('play'), 1200); G.won = true;
}

function aliveEnemy() { return G.mons.find(e => e.hp > 0); }
const seqTxt = (id) => t('cmd' + id) + ' : ' + COMMANDS[id].seq.join(' ');
function commandHint() {
  const foe = aliveEnemy();
  if (G.mons.some(e => e.hp > 0 && e.tele && e.dmg >= WARN_DMG)) return seqTxt('DEF');
  if (G.ship.hp <= SHIP.hull * 0.4) return seqTxt('HEAL');
  return foe && foe.x - G.ship.x <= RANGE ? seqTxt('ATK') : seqTxt('ADV');
}
// Protéger couvre sa réponse et la commande suivante (8 temps)
function guarded(k) {
  if (G.resp && G.resp.cmd === 'DEF' && k >= G.resp.k0 && k < G.resp.k0 + 8) return true;
  // L'équipage se met à l'abri dès qu'une commande Protéger est en cours de frappe
  const ph = G.phrase; if (!ph || ph.done) return false;
  const n = ph.S.reduce((a, x, i) => x ? i : a, -1);
  return n >= 2 && prefixOk(COMMANDS.DEF.seq, ph.S, n); // dès le 3e BOUM : seul Protéger commence ainsi
}
function onBeatVisual(k) {
  const m = Math.floor(k / 4), b = k % 4;
  G.pulse = 1; G.curMeasure = m; G.curBeat = G.mode === 'calib' ? b : k;
  const ph = $('phase'); let txt, go = false;
  if (G.mode === 'calib') {
    if (k >= CAL_END) { finishCalibGame(); return; }
    txt = m === 0 ? t('ready') + ' ' + (4 - b) : t('calTitle') + ' ' + (k - 3) + '/12'; go = m > 0;
    ph.textContent = txt; ph.classList.toggle('go', go); renderSlots(); flashSlot(b);
    if (save.frame) { const f = $('beatFrame'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
    return;
  }
  // Partie : le tempo tourne en continu, le joueur démarre quand il veut
  const ph$ = G.phrase && !G.phrase.done;
  if (k < G.playFrom) txt = t('ready') + ' ' + (G.playFrom - k);
  else if (inResp(k)) { const rb = k - G.resp.k0; txt = rb >= 2 ? t('soon') + ' ' + (4 - rb) : t('listen'); if (rb >= 2 && k >= G.hintHold) hint(commandHint()); }
  else { txt = t('yourTurn'); go = true; if (!ph$ && k >= G.hintHold) hint(commandHint()); }
  // Combo perdu si la commande suivante ne démarre pas juste après la réponse
  if (G.combo > 0 && G.lastRespEnd > 0 && k === G.lastRespEnd + 1 && !(G.phrase && G.phrase.k0 >= G.lastRespEnd)) {
    G.combo = 0; G.lastRespEnd = -99; powerStep(powerLoss()); hint(t('chainLost')); G.hintHold = k + 4;
  }
  ph.textContent = txt; ph.classList.toggle('go', go);
  renderSlots(); { const v = slotView(); if (v.cur >= 0) flashSlot(v.cur); }
  if (save.frame) { const f = $('beatFrame'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  // Histoire : premier monstre à portée de canon, entre deux ordres → scène avant le premier Attaquer
  { const foe = aliveEnemy();
    if (!sceneSeen('mer1_attaque') && foe && foe.x - G.ship.x <= RANGE && !inResp(k) && !(G.phrase && !G.phrase.done)) { pause(); playScene('mer1_attaque', resume); return; } }
  // Monstres : une attaque tous les « every » temps quand le navire est à portée, annoncée TELE temps avant, puis tombe sur le temps
  for (const e of G.mons) {
    if (e.hp <= 0 || e.x - G.ship.x > e.reach) continue;
    if (e.nextAtk == null) e.nextAtk = k + FIRST;
    if (k === e.nextAtk - TELE) { e.tele = 1; if (e.dmg >= WARN_DMG) { hint(t('incoming')); G.hintHold = k + 2; } }
    if (k === e.nextAtk) {
      e.tele = 0; e.nextAtk = k + e.every;
      G.shots.push({ mon: true, spit: !!e.spitter, x0: e.x - 34 * e.size, y0: SEA - 70 * e.size, x1: G.ship.x + 70, y1: SEA - 40, t: 0, dur: e.shotDur, dmg: e.dmg });
      playPad('BOUM', ctx.currentTime, 0.5, 0.6);
    }
  }
  if (!inResp(k)) return;
  const c = G.resp.cmd, rb = k - G.resp.k0, foe = aliveEnemy();
  if (c === 'ADV') {
    G.ship.tx = Math.min(G.ship.tx + SHIP.advance * (G.resp.full ? POWER.advMult : 1), foe ? foe.x - STOP : LEVEL.portX - 280);
  } else if (c === 'ATK' && (rb === 1 || rb === 3)) {
    const bonus = rb === 3 && G.resp.q >= 0.75 ? SHIP.perfectBonus : 0;
    const reach = foe && foe.x - G.ship.x <= RANGE;
    for (let i = 0; i < 2; i++) {
      const mx = G.ship.x + 62 + i * 46;
      G.shots.push({ x0: mx, y0: SEA - 30, x1: reach ? foe.x - 20 * foe.size + Math.random() * 16 : mx + 170 + Math.random() * 30, y1: reach ? SEA - 40 * foe.size : SEA + 4, t: 0, dur: 0.4 + i * 0.05, foe: reach ? foe : null, dmg: i === 0 ? (SHIP.shot + bonus) * powerMult() : 0 });
      G.ship.recoil[i] = 1;
    }
    if (rb === 1 && !reach) { hint(t('tooFar')); G.hintHold = k + 3; }
  } else if (c === 'HEAL' && (rb === 1 || rb === 3)) {
    G.ship.hp = Math.min(SHIP.hull, G.ship.hp + SHIP.heal * powerMult());
    G.fx.push({ x: G.ship.x - 20 + Math.random() * 60, y: SEA - 60, t: 0 });
  }
}
const JLABEL = { p: 'perfect', g: 'good', e: 'early', l: 'late', x: 'double' };
const EMPTY4 = [null, null, null, null];
function slotView() {
  const k = G.kOwn;
  if (inResp(k)) return { S: COMMANDS[G.resp.cmd].seq.map(p => p ? { pad: p, j: null } : null), cur: k - G.resp.k0, listen: true };
  const ph = G.phrase;
  if (ph && !ph.done) { const c = k - ph.k0; return { S: ph.S, cur: c >= 0 && c <= 3 ? c : -1, listen: false }; }
  if (ph && k < ph.k0 + 5) return { S: ph.S, cur: -1, listen: false };
  if (k < G.playFrom) return { S: EMPTY4, cur: -1, listen: true };
  // Au repos, seule la case 1 pulse sur chaque temps : la commande démarre toujours là
  return { S: EMPTY4, cur: 0, listen: false };
}
function renderSlots() {
  const box = $('slots'); box.innerHTML = '';
  let S = EMPTY4, cur = -1, listen = !G;
  if (G && G.mode === 'calib') { const m = G.curMeasure, mine = isPlayer(m); S = G.slots[mine ? m : m - 1] || EMPTY4; cur = mine ? G.ownSlot : -1; listen = !mine; }
  else if (G) ({ S, cur, listen } = slotView());
  for (let i = 0; i < 4; i++) {
    const d = document.createElement('div'); d.className = 'slot';
    if (i === cur) d.classList.add('own');
    if (listen) d.classList.add('listen');
    const s = S[i];
    if (s) { d.style.background = PADS[s.pad]; d.innerHTML = s.pad + (G.mode === 'calib' || !s.j ? '' : '<span class="j ' + s.j + '">' + t(JLABEL[s.j]) + '</span>'); }
    else d.textContent = String(i + 1);
    box.appendChild(d);
  }
}
function flashSlot(b) {
  const el = $('slots').children[b]; if (!el) return;
  el.classList.remove('beat'); void el.offsetWidth; el.classList.add('beat');
}

const fmtTime = (s) => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
function winGame() {
  G.won = true; save.best = Math.max(save.best, G.best);
  // Temps de jeu en temps de musique (les pauses ne comptent pas), depuis la fin du décompte
  const time = Math.max(0, (G.lastVis - G.countBeats) * SPB); // décomptes exclus
  const stars = G.sunk ? 0 : 1 + (G.ship.hp >= SHIP.hull * STARS.hullRatio ? 1 : 0) + (time <= STARS.refTime ? 1 : 0);
  G.result = { time, stars };
  save.stars = Math.max(save.stars || 0, stars); persist();
  $('stars').innerHTML = [0, 1, 2].map(i => '<i class="' + (i < stars ? 'on' : '') + '">★</i>').join('');
  // Détail : chaque étoile avec sa condition, réussie ou non, et la coque restante
  const hullOk = G.ship.hp >= SHIP.hull * STARS.hullRatio, timeOk = time <= STARS.refTime;
  const hullTxt = Math.floor(G.ship.hp) + '/' + SHIP.hull, hullMin = Math.ceil(SHIP.hull * STARS.hullRatio);
  const rows = G.sunk ? [[false, t('starsSunk')]] : [
    [true, t('starPort')],
    [hullOk, t('starHull')(hullTxt, hullMin)],
    [timeOk, t('starTime')(fmtTime(time), fmtTime(STARS.refTime))],
  ];
  $('starsWhy').innerHTML = rows.map(([ok, txt]) => '<span class="' + (ok ? 'ok' : '') + '"><b>' + (ok ? '★' : '☆') + '</b>' + txt + '</span>').join('');
  G.result.rows = rows.map(r => r[0]);
  const at = ctx.currentTime + 0.1;
  [1, 1.25, 1.5, 2].forEach((p, i) => playPad('DING', at + i * 0.15, 0.8, p));
  cheer(at + 0.2, true); cheer(at + 1.1, true); stopMusic(true);
  $('sP').textContent = G.stats.p; $('sG').textContent = G.stats.g; $('sM').textContent = G.stats.o; $('sC').textContent = G.best;
  setTimeout(() => playScene('mer1_plaque', () => openOverlay('ovWin')), 900);
}

const lerp = (a, b, k) => a + (b - a) * k;
function update(dt) {
  const now = audibleAt(performance.now());
  const kv = Math.floor((now - G.start) / SPB);
  while (G.lastVis < kv && !G.won) { G.lastVis++; if (G.lastVis >= 0) onBeatVisual(G.lastVis); }
  if (G.mode === 'play' && musicBuf && !musicSrc && !G.won) startMusic(G.lastVis + 2); // musique chargée en retard
  const sh = G.ship, px = sh.x;
  sh.x = lerp(sh.x, sh.tx, 0.08); sh.wheel += (sh.x - px) * 0.05 + dt * 0.3;
  sh.recoil = sh.recoil.map(r => Math.max(0, r - dt * 4)); sh.hurt = Math.max(0, sh.hurt - dt * 2.5);
  updateCrew(dt);
  checkEvaluate(now);
  const kOwn = Math.round((now - (G.mode === 'calib' ? 0 : (save.offset ?? 0.05)) - G.start) / SPB);
  G.kOwn = kOwn;
  if (G.mode === 'calib') {
    const own = isPlayer(Math.floor(kOwn / 4)) ? ((kOwn % 4) + 4) % 4 : -1;
    if (own !== G.ownSlot) { G.ownSlot = own; renderSlots(); }
  } else {
    const v = slotView(), sig = v.cur + '|' + v.listen + '|' + v.S.map(x => x ? x.pad + x.j : '-').join();
    if (sig !== G.sig) { G.sig = sig; renderSlots(); }
  }
  G.pulse = Math.max(0, G.pulse - dt * 4); G.shake = Math.max(0, G.shake - dt * 3);
  G.heat = lerp(G.heat ?? 0, G.power / POWER.steps, 0.03);
  for (const s of G.shots) {
    s.t += dt; if (s.t < s.dur || s.done) continue; s.done = true;
    if (s.mon) {
      const block = guarded(G.curBeat);
      const dmg = block ? s.dmg * SHIP.guard : s.dmg;
      sh.hp = Math.max(0, sh.hp - dmg); sh.hurt = 1; G.shake = block ? 0.3 : 1;
      G.puffs.push({ x: s.x1, y: s.y1, t: 0, big: !block, blue: block });
      if (block) { banner(t('blocked')); cheer(ctx.currentTime + 0.1, false); } else { vibrate(40); groan(ctx.currentTime + 0.05); }
      if (sh.hp <= 0) sinkShip();
    } else {
      if (s.foe && s.foe.hp > 0 && s.dmg) { s.foe.hp -= s.dmg; s.foe.shake = 1; playPad('TAK', ctx.currentTime, 0.4, 0.6); if (s.foe.hp <= 0) { s.foe.tele = 0; cheer(ctx.currentTime + 0.15, true); } }
      G.puffs.push({ x: s.x1, y: s.y1, t: 0 });
    }
  }
  G.shots = G.shots.filter(s => !s.done);
  for (const p of G.puffs) p.t += dt; G.puffs = G.puffs.filter(p => p.t < 0.6);
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < 0.9);
  for (const e of G.mons) {
    e.shake = Math.max(0, e.shake - dt * 4); e.raise = lerp(e.raise, e.tele ? 1 : 0, 0.12);
    if (e.hp <= 0) e.fade = Math.max(0, e.fade - dt * 0.8);
  }
  if (!G.won && !aliveEnemy() && sh.x >= LEVEL.portX - 300) winGame();
  if (G.won) G.totemLit = Math.min(1, G.totemLit + dt);
}
// Équipage : un matelot fixe par poste, les autres foncent (en paniquant) vers la zone de chaque ordre
const ZONES = { machines: { y: 22, x0: -112, x1: 84 }, canons: { y: -6, x0: 6, x1: 122 }, pont: { y: -42, x0: -146, x1: -74 }, proue: { y: -42, x0: 34, x1: 150 } };
const ORDER_ZONE = { ADV: 'machines', ATK: 'canons', DEF: 'proue', HEAL: 'pont' };
const FIXED = [[-82, 22, 'machines'], [36, -6, 'canons'], [-120, -42, 'pont'], [146, -42, 'proue']];
const LADDER = -56;
function newCrew() { return Array.from({ length: 6 }, (_, i) => ({ x: -118 + i * 17, y: -6, tx: -118 + i * 17, ty: -6, panic: 0, ph: i * 1.3, zone: null })); }
function orderCrew(cmd) {
  const z = ZONES[ORDER_ZONE[cmd]], zn = ORDER_ZONE[cmd];
  G.crew.forEach((r, i) => {
    if (r.zone === zn && r.y === z.y) return; // déjà sur place
    r.tx = lerp(z.x0, z.x1, (i + 0.5) / G.crew.length) + (Math.random() - 0.5) * 10; r.ty = z.y; r.panic = 1.3; r.zone = zn;
  });
}
function updateCrew(dt) {
  const v = 230 * dt;
  for (const r of G.crew) {
    r.panic = Math.max(0, r.panic - dt);
    const step = (a, b) => Math.abs(b - a) <= v ? b : a + Math.sign(b - a) * v;
    if (r.y !== r.ty) { if (r.x !== LADDER) r.x = step(r.x, LADDER); else r.y = step(r.y, r.ty); }
    else r.x = step(r.x, r.tx);
  }
}
// Pas de game over : coque à zéro, le navire rentre au port réparé, les monstres gardent leurs dégâts
function sinkShip() {
  banner(t('sunk'), true);
  const sh = G.ship; sh.hp = SHIP.hull; sh.x = sh.tx = 140; G.cam = null; G.sunk = true;
  G.combo = 0; G.lastRespEnd = -99; G.power = 0; updateCombo();
  G.shots = []; for (const e of G.mons) { e.nextAtk = null; e.tele = 0; }
}
