// Souquez ! : combat contre Tonton Homard (Léviathan de la mer 1). Réglages dans BOSS (js/donnees.js).
// Phase 1 (40 → 25) : pince-marteau, 6 dégâts tous les 24 temps, annoncée 10 temps avant ; 1er coup au temps 28.
// Phase 2 (25 → 12) : la pince continue ; 2 Sardines-à-Vapeur appelées une fois, à ~280 devant le navire ; jet de vapeur non annoncé.
// Phase 3 (12 → 0)  : double pince, 2 coups de 5 à 4 temps d'écart (un seul Protéger bien placé couvre les deux).
// Coque cédée : le combat se relance tout de suite.
'use strict';
let ZOOM = 1, B = null;
const resetBoss = () => { B = { phase: 1, next: null, second: null, dbl: false, jet: null, appel: false }; ZOOM = 1; };
resetBoss();
const enBoss = () => !!(MISSION && MISSION.boss && G && G.mode === 'play');
const homard = () => G && G.mons.find((e) => e.type === 'homard');
function pince(h, dmg) {
  G.shots.push({ mon: true, x0: h.x - 70 * h.size, y0: corpsY(h, 95), x1: G.ship.x + 70, y1: SEA - 40, t: 0, dur: 0.42, dmg });
  playPad('BOUM', ctx.currentTime, 0.7, 0.5); h.shake = 0.6;
  // Pour le dessin : 1er ou 2e coup de la double pince
  if (h._double) { h._atk2 = performance.now() / 1000; h._double = false; } else { h._atk = performance.now() / 1000; h._double = B.dbl; }
}
// Appelé à chaque temps par onBeatVisual (js/partie.js)
function bossBeat(k) {
  if (!enBoss() || G.won || k < G.playFrom) return;
  const h = homard(); if (!h || h.hp <= 0) return;
  B.phase = h.hp > BOSS.phase2 ? 1 : h.hp > BOSS.phase3 ? 2 : 3;
  if (B.phase >= 2 && !B.appel) { // 2 Sardines devant lui (une seule fois) ; en tête de liste, elles prennent les tirs
    B.appel = true; banner(t('bossCalls'));
    const T = MONSTERS.sardine;
    for (const x of [G.ship.x + 265, G.ship.x + 295]) G.mons.unshift({ ...T, type: 'sardine', x, max: T.hp, shake: 0, fade: 1, nextAtk: k + FIRST, tele: 0, raise: 0 });
    B.jet = k + 6;
  }
  if (B.next == null) B.next = Math.max(BOSS.premier, k + BOSS.tele);
  if (k === B.next - BOSS.tele) { h.tele = 1; B.dbl = B.phase === 3; crewPanic(); hint(t('incoming')); G.hintHold = k + 3; }
  if (k === B.next) { pince(h, B.dbl ? BOSS.double : BOSS.pince); if (B.dbl) B.second = k + BOSS.ecart; else h.tele = 0; B.next = k + BOSS.every; }
  if (k === B.second) { pince(h, BOSS.double); B.second = null; h.tele = 0; }
  if (B.phase === 2 && B.jet != null && k >= B.jet) { // jet de vapeur, non annoncé
    G.shots.push({ mon: true, spit: true, jet: true, x0: h.x - 40 * h.size, y0: corpsY(h, 60) + 10, x1: G.ship.x + 60, y1: SEA - 30, t: 0, dur: 0.5, dmg: BOSS.jet });
    h._jet = performance.now() / 1000; B.jet = k + BOSS.jetEvery;
  }
}
// Léger dézoom pendant les coups annoncés (appelé par update)
function bossUpdate() { const h = enBoss() && homard(); ZOOM = lerp(ZOOM, h && h.hp > 0 && h.tele ? BOSS.zoom : 1, 0.04); }
