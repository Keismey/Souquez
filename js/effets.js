// Souquez ! : effets dessinés en canvas, charte piste 3 (trait marine fin, aplats, palette du navire v3).
// EFFETS.draw(g, nom, x, y, taille, k, t, dir, seed)
// - nom : 'tir', 'boulet', 'impact-monstre', 'impact-coque', 'soin', 'bouclier', 'eclaboussure', 'sillage'
// - (x, y) : point d'origine (bouche du canon, point d'impact, surface de l'eau...) ; taille : taille de référence en px
// - k : avancement de 0 à 1 (effets ponctuels, voir EFFETS.durees en secondes) ; t : temps continu en secondes
// - dir : 1 vers la droite (le navire tire à droite), -1 à gauche ; seed : variation (dispersion des éclats)
// Cas particuliers : 'boulet' ignore k (le jeu le déplace) ; 'sillage' est continu (k = vitesse du navire, 0 à 1) ;
// 'bouclier' : k = apparition (0 → 1, reste à 1 tant qu'il est actif), seed = intensité d'un coup encaissé (0 à 1).
// Aucun accès à la page, aucun état caché, save/restore autour du dessin, pas de shadowBlur ni de filter.
'use strict';
const EFFETS = (() => {
  const C = { marine: '#1F2A44', brique: '#B5452F', creme: '#F2E6CC', moutarde: '#E0A82E', vert: '#7FA89A', marine2: '#3C4D6B', sable: '#D9C9A6' };
  const TAU = Math.PI * 2, BEAT = 60 / 102;
  const clamp = v => Math.max(0, Math.min(1, v)), frac = v => v - Math.floor(v);
  const easeOut = x => 1 - (1 - x) * (1 - x);
  // Hasard déterministe : même seed, mêmes éclats
  const rnd = (s, i) => frac(Math.sin(s * 127.1 + i * 311.7) * 43758.5453);
  function trace(g, lw) { g.lineWidth = lw; g.strokeStyle = C.marine; g.stroke(); }
  function rond(g, lw, x, y, r, col) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = col; g.fill(); trace(g, lw); }
  function bouffee(g, lw, x, y, r, col) {
    // Nuage en 3 bosses, contour unique (contour dessous, aplat dessus)
    const p = () => { g.beginPath(); g.arc(x - r * 0.55, y + r * 0.15, r * 0.7, 0, TAU); g.moveTo(x + r, y); g.arc(x, y - r * 0.15, r, 0, TAU); g.moveTo(x + r * 1.25, y + r * 0.2); g.arc(x + r * 0.6, y + r * 0.2, r * 0.65, 0, TAU); };
    p(); g.strokeStyle = C.marine; g.lineWidth = lw * 2; g.stroke(); p(); g.fillStyle = col; g.fill();
  }
  function etoile(g, lw, r, n, col, creux) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU - Math.PI / 2, rr = i % 2 ? r * (creux || 0.45) : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = col; g.fill(); trace(g, lw);
  }

  // Tir de canon : éclair moutarde, bouffées de fumée crème qui s'éloignent et grossissent
  function tir(g, lw, k, t, s) {
    if (k < 0.35) { const f = 1 - k / 0.35; g.save(); g.translate(10 * (1 - f), 0); g.scale(0.7 + f * 0.6, 0.7 + f * 0.6); g.rotate(rnd(s, 1) * 0.6); etoile(g, lw, 14, 6, C.moutarde, 0.5); g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fillStyle = C.creme; g.fill(); g.restore(); }
    for (let i = 0; i < 4; i++) {
      const d = clamp(k * 1.3 - i * 0.08), r = 4 + d * 9 + i;
      if (d <= 0 || d >= 1) continue;
      g.globalAlpha = 1 - easeOut(d) * 0.9;
      bouffee(g, lw, 8 + d * (26 + i * 10), -d * (10 + i * 4) + (rnd(s, i) - 0.5) * 8, r, i % 2 ? C.creme : C.sable);
    }
    g.globalAlpha = 1;
  }
  // Boulet : sphère marine, reflet crème, traînée de vitesse
  function boulet(g, lw, t) {
    g.strokeStyle = C.creme; g.lineWidth = lw * 2; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 3; i++) { g.moveTo(-8 - i * 2, -3 + i * 3); g.lineTo(-20 - i * 4 - Math.sin(t * 30 + i) * 2, -3 + i * 3); }
    g.stroke();
    rond(g, lw, 0, 0, 5, C.marine2);
    g.beginPath(); g.arc(-1.5, -1.6, 1.6, 0, TAU); g.fillStyle = C.creme; g.fill();
  }
  // Impact sur un monstre : étoile moutarde, onde, ferraille qui saute (boulons, plaques)
  function impactMonstre(g, lw, k, t, s) {
    if (k < 0.4) { const f = 1 - k / 0.4; g.save(); g.scale(0.6 + f * 0.7, 0.6 + f * 0.7); g.rotate(rnd(s, 2)); etoile(g, lw, 18, 7, C.moutarde, 0.55); etoile(g, lw, 8, 7, C.creme, 0.55); g.restore(); }
    g.globalAlpha = 1 - k; g.beginPath(); g.arc(0, 0, 8 + easeOut(k) * 26, 0, TAU); g.strokeStyle = C.moutarde; g.lineWidth = lw * 2.4 * (1 - k); g.stroke(); g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (0.15 + rnd(s, i) * 0.7) + (rnd(s, i + 9) - 0.5), v = 24 + rnd(s, i + 3) * 26;
      const x = Math.cos(a) * v * k, y = Math.sin(a) * v * k + 40 * k * k;
      g.save(); g.translate(x, y); g.rotate(k * 9 * (rnd(s, i + 5) - 0.5)); g.globalAlpha = clamp((1 - k) * 2);
      if (i % 3 === 0) { g.beginPath(); g.rect(-3, -2, 6, 4); g.fillStyle = C.sable; g.fill(); trace(g, lw); }
      else if (i % 3 === 1) { g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fillStyle = C.marine2; g.fill(); trace(g, lw * 0.8); }
      else { g.beginPath(); g.moveTo(-3, 2); g.lineTo(0, -3); g.lineTo(3, 2); g.closePath(); g.fillStyle = C.moutarde; g.fill(); trace(g, lw * 0.8); }
      g.restore();
    }
    g.globalAlpha = 1;
  }
  // Impact sur la coque : éclats de bois et de tôle, jet de vapeur qui fuit, rivets qui sautent
  function impactCoque(g, lw, k, t, s) {
    if (k < 0.3) { const f = 1 - k / 0.3; g.save(); g.scale(0.5 + f * 0.7, 0.5 + f * 0.7); etoile(g, lw, 16, 5, C.creme, 0.5); g.restore(); }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (0.1 + rnd(s, i) * 0.8), v = 20 + rnd(s, i + 4) * 30;
      const x = Math.cos(a) * v * k, y = Math.sin(a) * v * k + 50 * k * k;
      g.save(); g.translate(x, y); g.rotate(k * 10 * (rnd(s, i + 7) - 0.5)); g.globalAlpha = clamp((1 - k) * 2);
      g.beginPath(); g.moveTo(-4, 1); g.lineTo(-1, -2.5); g.lineTo(4, -1); g.lineTo(1, 2.5); g.closePath(); g.fillStyle = i % 2 ? C.brique : C.sable; g.fill(); trace(g, lw * 0.8);
      g.restore();
    }
    // Jet de vapeur (dure plus longtemps que les éclats)
    const v = clamp(k * 1.4);
    for (let i = 0; i < 5; i++) {
      const d = frac(t * 2.2 + i / 5), r = 3 + d * 8;
      g.globalAlpha = (1 - d) * (1 - v * 0.8);
      bouffee(g, lw, -d * 30 - 4, -6 - d * 22, r, C.creme);
    }
    g.globalAlpha = 1;
  }
  // Soin (Doc) : croix brique sur pastilles crème et bulles vert d'eau qui montent, anneau qui s'élargit
  function soin(g, lw, k, t, s) {
    g.globalAlpha = clamp((1 - k) * 2.2); g.beginPath(); g.ellipse(0, 0, 10 + easeOut(k) * 34, 3 + easeOut(k) * 8, 0, 0, TAU); g.strokeStyle = C.vert; g.lineWidth = lw * 2.4; g.stroke(); g.globalAlpha = 1;
    for (let i = 0; i < 5; i++) {
      const d = clamp(k * 1.4 - i * 0.09); if (d <= 0 || d >= 1) continue;
      const x = (rnd(s, i) - 0.5) * 50 + Math.sin(d * 6 + i) * 4, y = -d * (40 + rnd(s, i + 2) * 20);
      g.globalAlpha = d < 0.75 ? 1 : (1 - d) / 0.25;
      if (i % 2 === 0) {
        g.save(); g.translate(x, y); const r = 6 + (i === 0 ? 2 : 0);
        rond(g, lw, 0, 0, r, C.creme); g.fillStyle = C.brique; g.fillRect(-r * 0.2, -r * 0.6, r * 0.4, r * 1.2); g.fillRect(-r * 0.6, -r * 0.2, r * 1.2, r * 0.4);
        g.restore();
      } else { rond(g, lw * 0.8, x, y, 2.5 + rnd(s, i) * 2, C.vert); g.beginPath(); g.arc(x - 0.8, y - 0.8, 0.8, 0, TAU); g.fillStyle = C.creme; g.fill(); }
    }
    g.globalAlpha = 1;
  }
  // Bouclier (Protéger) : dôme de plaques rivetées vert d'eau translucides devant le navire, qui bat au tempo
  function bouclier(g, lw, k, t, coup) {
    const a = easeOut(k), b = Math.exp(-frac(t / BEAT) * 6) * 0.06, R = 60 * (0.85 + a * 0.15) * (1 + b + coup * 0.05);
    const a0 = -1.05, a1 = 1.05, n = 6;
    g.globalAlpha = 0.35 * a + coup * 0.3; g.beginPath(); g.arc(0, 0, R, a0, a1); g.arc(0, 0, R - 9, a1, a0, true); g.closePath(); g.fillStyle = coup > 0.3 ? C.creme : C.vert; g.fill();
    g.globalAlpha = a;
    g.beginPath(); g.arc(0, 0, R, a0, a1); g.strokeStyle = C.marine; g.lineWidth = lw * 1.4; g.stroke();
    g.beginPath(); g.arc(0, 0, R - 9, a0, a1); g.lineWidth = lw; g.stroke();
    for (let i = 0; i <= n; i++) {
      const an = a0 + (a1 - a0) * i / n;
      g.beginPath(); g.moveTo(Math.cos(an) * (R - 9), Math.sin(an) * (R - 9)); g.lineTo(Math.cos(an) * R, Math.sin(an) * R); g.stroke();
      if (i < n) { const am = an + (a1 - a0) / n / 2; g.beginPath(); g.arc(Math.cos(am) * (R - 4.5), Math.sin(am) * (R - 4.5), 1.4, 0, TAU); g.fillStyle = C.moutarde; g.fill(); trace(g, lw * 0.7); }
    }
    if (coup > 0.05) { g.globalAlpha = coup; g.save(); g.translate(Math.cos(0) * R, 0); g.scale(0.6 + coup * 0.6, 0.6 + coup * 0.6); etoile(g, lw, 12, 6, C.moutarde, 0.5); g.restore(); }
    g.globalAlpha = 1;
  }
  // Éclaboussure : gerbe vert d'eau à crêtes crème, gouttes qui retombent
  function eclaboussure(g, lw, k, t, s) {
    const h = Math.sin(clamp(k * 1.6) * Math.PI) * 26;
    if (h > 0.5) {
      g.beginPath(); g.moveTo(-14, 0);
      for (let i = 0; i <= 6; i++) { const x = -14 + i * 28 / 6, hh = h * (i % 2 ? 1 : 0.6) * (1 - Math.abs(i - 3) / 5); g.lineTo(x, -hh); }
      g.lineTo(14, 0); g.closePath(); g.fillStyle = C.vert; g.fill(); trace(g, lw);
      g.beginPath(); for (let i = 1; i < 6; i += 2) { const x = -14 + i * 28 / 6, hh = h * (1 - Math.abs(i - 3) / 5); g.moveTo(x - 2.5, -hh + 3); g.lineTo(x, -hh); g.lineTo(x + 2.5, -hh + 3); } g.strokeStyle = C.creme; g.lineWidth = lw * 1.6; g.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (0.2 + rnd(s, i) * 0.6), v = 30 + rnd(s, i + 2) * 30;
      const x = Math.cos(a) * v * k, y = Math.sin(a) * v * k + 70 * k * k;
      if (y > 2) continue;
      g.globalAlpha = clamp((1 - k) * 2); rond(g, lw * 0.8, x, y, 1.6 + rnd(s, i + 6) * 1.8, i % 2 ? C.creme : C.vert);
    }
    g.globalAlpha = 1;
  }
  // Sillage : traînée d'écume derrière la poupe (vers -x), qui défile avec la vitesse
  function sillage(g, lw, v, t, L) {
    if (v <= 0.02) return;
    g.lineCap = 'round';
    for (let r = 0; r < 3; r++) {
      const y = 2 + r * 4, n = 5;
      for (let i = 0; i < n; i++) {
        const d = frac(i / n + t * (0.6 + v) + r * 0.17), x = -d * L * (0.6 + v * 0.4), w = (1 - d) * 10 * v + 3;
        g.globalAlpha = (1 - d) * clamp(v * 1.5);
        g.beginPath(); g.moveTo(x - w, y + d * 3); g.lineTo(x + w, y + d * 3);
        g.strokeStyle = C.marine; g.lineWidth = lw * 2 + 3 * (1 - d); g.stroke(); g.strokeStyle = C.creme; g.lineWidth = 3 * (1 - d); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }

  const DUREES = { tir: 0.7, 'impact-monstre': 0.6, 'impact-coque': 1.1, soin: 1.4, eclaboussure: 0.7 };
  function draw(g, nom, x, y, taille, k, t, dir, seed) {
    const sc = (taille || 40) / 40, lw = Math.max(0.8, 1.1 / sc);
    g.save();
    g.translate(x, y); g.scale((dir || 1) * sc, sc);
    g.lineJoin = 'round'; g.lineCap = 'round';
    k = clamp(k || 0); t = t || 0; seed = seed || 0;
    if (nom === 'tir') tir(g, lw, k, t, seed);
    else if (nom === 'boulet') boulet(g, lw, t);
    else if (nom === 'impact-monstre') impactMonstre(g, lw, k, t, seed);
    else if (nom === 'impact-coque') impactCoque(g, lw, k, t, seed);
    else if (nom === 'soin') soin(g, lw, k, t, seed);
    else if (nom === 'bouclier') bouclier(g, lw, k, t, clamp(seed));
    else if (nom === 'eclaboussure') eclaboussure(g, lw, k, t, seed);
    else if (nom === 'sillage') sillage(g, lw, k, t, 60);
    g.restore();
  }
  return { draw, durees: DUREES, noms: ['tir', 'boulet', 'impact-monstre', 'impact-coque', 'soin', 'bouclier', 'eclaboussure', 'sillage'], BEAT };
})();
