// Souquez ! : prototype du combat contre Tonton Homard (Léviathan de la mer 1), formes simples.
// Chargé par outils/boss.html après les scripts du jeu. Détail du Game design (GDD, « Mer 1 en détail ») :
//   106 BPM, 40 PV, combat sur place, référence 1:45.
//   Phase 1 (40 → 25) : pince-marteau, 6 dégâts tous les 24 temps, annoncée 10 temps avant ; 1er coup au temps 28.
//   Sardines appelées : à ~280 devant le navire, stats habituelles (1re attaque 10 temps après l'apparition). Jet de vapeur : phase 2 seulement.
//   Phase 2 (25 → 12) : la pince continue ; 2 Sardines-à-Vapeur appelées une fois, devant lui (elles le protègent) ;
//                        jet de vapeur 1 dégât tous les 12 temps, non annoncé.
//   Phase 3 (12 → 0)  : double pince, 2 coups de 5 à 4 temps d'écart, tous les 24 temps, annoncée 10 temps avant
//                        (un seul Protéger bien placé couvre les deux).
//   Coque cédée : le combat se relance tout de suite. Fin : le homard lâche la plaque gravée.
'use strict';
const BOSS = { tele: 10, every: 24, pince: 6, double: 5, ecart: 4, jet: 1, jetEvery: 12, premier: 28, zoom: 0.84 };
MONSTERS.homard = { hp: 40, dmg: BOSS.pince, every: BOSS.every, reach: -1e9 /* attaques gérées ici */, size: 1.5, color: '#b5452f', shotDur: 0.5, boss: true };
LEVEL.portX = -2000; // combat sur place : pas de port à atteindre (ni de fort à l'horizon), il faut vaincre le homard
LEVEL.monsters = [{ type: 'homard', x: 500 }];
STARS.refTime = 105;
// Sauvegarde du jeu intacte : rien n'est écrit, et les scènes déjà vues ne repassent pas (sauf la plaque, en fin de combat)
persist = function () {};
save.seen = Object.assign({}, save.seen, { mer1_intro: true, mer1_attaque: true, mer1_plaque: false });
document.querySelector('#ovTitle h1').textContent = 'Tonton Homard';
document.querySelector('#ovTitle p').textContent = 'Prototype du combat (formes simples, 106 BPM). Rien n’est enregistré.';

let B = null;
const resetBoss = () => { B = { phase: 1, next: null, second: null, dbl: false, jet: null, appel: false }; window.ZOOM = 1; };
resetBoss();
const homard = () => G && G.mons.find((e) => e.type === 'homard');
function pince(h, dmg) {
  G.shots.push({ mon: true, x0: h.x - 70 * h.size, y0: SEA - 95 * h.size, x1: G.ship.x + 70, y1: SEA - 40, t: 0, dur: 0.42, dmg });
  playPad('BOUM', ctx.currentTime, 0.7, 0.5); h.shake = 0.6;
}
function bossBeat(k) {
  if (!G || G.mode !== 'play' || G.won) return; // tourne aussi pendant le décompte de reprise (comme les autres monstres)
  const h = homard(); if (!h || h.hp <= 0) return;
  B.phase = h.hp > 25 ? 1 : h.hp > 12 ? 2 : 3;
  // Phase 2 : appelle 2 Sardines-à-Vapeur devant lui (une seule fois) ; placées en tête de liste, elles prennent les tirs
  if (B.phase >= 2 && !B.appel) {
    B.appel = true; banner('Tonton Homard appelle ses petits !');
    const T = MONSTERS.sardine;
    // à environ 280 devant le navire (à portée, elles attaquent vraiment) ; 1re attaque 10 temps après l'apparition
    for (const x of [G.ship.x + 265, G.ship.x + 295]) G.mons.unshift({ ...T, type: 'sardine', x, max: T.hp, shake: 0, fade: 1, nextAtk: k + FIRST, tele: 0, raise: 0 });
    B.jet = k + 6;
  }
  // Pince (et double pince en phase 3), annoncée 10 temps avant
  if (B.next == null) B.next = Math.max(BOSS.premier, k + BOSS.tele); // 1er coup au temps 28 (annoncé au 18), le joueur s'installe
  if (!h.tele && B.second == null && k >= B.next - BOSS.tele && k < B.next) { h.tele = 1; B.dbl = B.phase === 3; crewPanic(); hint(t('incoming')); G.hintHold = k + 3; }
  if (k >= B.next) { pince(h, B.dbl ? BOSS.double : BOSS.pince); if (B.dbl) B.second = k + BOSS.ecart; else h.tele = 0; B.next = k + BOSS.every; }
  if (B.second != null && k >= B.second) { pince(h, BOSS.double); B.second = null; h.tele = 0; }
  // Jet de vapeur, non annoncé (phase 2)
  if (B.phase === 2 && B.jet != null && k >= B.jet) {
    G.shots.push({ mon: true, spit: true, x0: h.x - 40 * h.size, y0: SEA - 60 * h.size, x1: G.ship.x + 60, y1: SEA - 30, t: 0, dur: 0.5, dmg: BOSS.jet });
    B.jet = k + BOSS.jetEvery;
  }
}
const _onBeatVisual = onBeatVisual;
onBeatVisual = function (k) { bossBeat(k); return _onBeatVisual.apply(this, arguments); };
// Léger dézoom pendant les coups annoncés
const _update = update;
update = function (dt) { _update(dt); const h = homard(); window.ZOOM = lerp(window.ZOOM || 1, h && h.hp > 0 && h.tele ? BOSS.zoom : 1, 0.04); };
// Nouvelle partie / coque cédée : le combat repart de zéro
const _newGame = newGame;
newGame = function (mode) { resetBoss(); return _newGame(mode); };
sinkShip = function () { banner(t('sunk'), true); G.won = true; stopMusic(true); setTimeout(() => newGame('play'), 1800); };
// Musique du jeu (102 BPM) jouée plus vite pour tomber sur 106 BPM
function startMusic(k) {
  if (!musicBuf || !G || G.mode !== 'play') return;
  stopMusic();
  const spb0 = 60 / 102, loop = MUS_BEATS * spb0, at = Math.max(beatTime(k), ctx.currentTime + 0.05), kk = (at - G.start) / SPB;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = musicBuf; src.loop = true; src.loopStart = MUS_OFF; src.loopEnd = MUS_OFF + loop; src.playbackRate.value = BPM / 102;
  src.connect(g); g.connect(musicBus); src._g = g;
  src.start(at, MUS_OFF + (((kk * spb0) % loop) + loop) % loop);
  musicSrc = src;
}
// Dessin du homard (formes simples en attendant la DA) : pince-marteau à vapeur qui se lève à l'annonce
const _drawMonster = drawMonster;
drawMonster = function (e) {
  if (e.type !== 'homard') return _drawMonster(e);
  if (e.fade <= 0) return;
  const z = e.size, x = e.x + (Math.random() - 0.5) * 8 * e.shake, up = e.raise;
  cx.save(); cx.globalAlpha = e.fade; cx.translate(x, SEA + 10 + (1 - e.fade) * 90);
  const rouge = '#b5452f', fonce = '#7c2e1f', creme = '#f2e6cc', marine = '#1f2a44';
  // Queue en segments (derrière, vers la droite)
  for (let i = 3; i >= 0; i--) { cx.fillStyle = i % 2 ? fonce : rouge; cx.beginPath(); cx.ellipse((34 + i * 18) * z, -8 * z - i * 2 * z, (16 - i * 2) * z, (12 - i) * z, 0, 0, 7); cx.fill(); }
  // Corps
  cx.fillStyle = rouge; cx.beginPath(); cx.ellipse(0, -26 * z, 38 * z, 24 * z, -0.1, 0, 7); cx.fill();
  cx.strokeStyle = fonce; cx.lineWidth = 3 * z; for (let i = 0; i < 3; i++) { cx.beginPath(); cx.arc(8 * z + i * 10 * z, -26 * z, 20 * z, -1.2, 1.2); cx.stroke(); }
  // Yeux sur pédoncules
  for (const dx of [-26, -16]) { cx.strokeStyle = fonce; cx.lineWidth = 3 * z; cx.beginPath(); cx.moveTo(dx * z, -44 * z); cx.lineTo((dx - 4) * z, -62 * z); cx.stroke(); cx.fillStyle = creme; cx.beginPath(); cx.arc((dx - 4) * z, -64 * z, 5 * z, 0, 7); cx.fill(); cx.fillStyle = e.tele ? '#ff5a3a' : marine; cx.beginPath(); cx.arc((dx - 6) * z, -64 * z, 2.4 * z, 0, 7); cx.fill(); }
  // Petite pince (devant, en bas)
  cx.fillStyle = rouge; cx.beginPath(); cx.ellipse(-46 * z, -10 * z, 12 * z, 7 * z, 0.3, 0, 7); cx.fill();
  cx.fillStyle = fonce; cx.beginPath(); cx.moveTo(-56 * z, -12 * z); cx.lineTo(-66 * z, -18 * z); cx.lineTo(-60 * z, -6 * z); cx.fill();
  // Pince-marteau : bras qui se lève à l'annonce, marteau-pilon à vapeur au bout
  cx.save(); cx.translate(-30 * z, -38 * z); cx.rotate(0.2 + up * 1.0);
  cx.strokeStyle = rouge; cx.lineWidth = 14 * z; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-38 * z, 0); cx.stroke();
  cx.translate(-48 * z, 0);
  cx.fillStyle = '#3c4d6b'; cx.fillRect(-14 * z, -24 * z, 28 * z, 48 * z);           // tête du marteau
  cx.fillStyle = '#e0a82e'; cx.fillRect(-14 * z, -6 * z, 28 * z, 6 * z);              // bande moutarde
  cx.fillStyle = marine; cx.fillRect(-16 * z, 18 * z, 32 * z, 8 * z);                 // face de frappe
  if (e.tele) for (let i = 0; i < 3; i++) { const k2 = (tAmb * 2.2 + i / 3) % 1; cx.fillStyle = 'rgba(242,230,204,' + (0.8 * (1 - k2)) + ')'; cx.beginPath(); cx.arc((10 + k2 * 24) * z, (-28 - k2 * 18) * z, (5 + k2 * 8) * z, 0, 7); cx.fill(); }
  cx.restore();
  // Annonce : halo rouge
  if (e.tele) { cx.fillStyle = 'rgba(255,90,58,.18)'; cx.beginPath(); cx.arc(-60 * z, -80 * z, 40 * z, 0, 7); cx.fill(); }
  // Barre de vie (40 PV) avec les seuils des phases
  const bw = 90 * z, by = -110 * z; cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(-bw / 2, by, bw, 7);
  cx.fillStyle = '#ffd447'; cx.fillRect(-bw / 2, by, bw * Math.max(0, e.hp) / e.max, 7);
  cx.fillStyle = marine; for (const s of [25, 12]) cx.fillRect(-bw / 2 + bw * s / e.max - 1, by - 2, 2, 11);
  cx.restore();
};
