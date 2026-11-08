// Souquez ! : monstres mi-bête mi-machine dessinés en canvas, charte piste 3 (même trait et palette que l'équipage).
// MONSTRES.draw(g, nom, x, y, h, t, dir, seed, etat)
// - (x, y) : le monstre posé sur la ligne de flottaison ; h : hauteur en px (de la flottaison au sommet).
//   Une partie du corps passe sous la flottaison (jusqu'à environ +0,3·h) : le jeu peut dessiner la mer par-dessus.
// - t : temps en secondes (nage, bulles, hélice). dir : 1 regarde à droite (dessin de base), -1 à gauche. seed : décalage.
// - etat : { prepare, attaque, touche, coule }, chacun de 0 à 1, pilotés par le jeu (Tonton Homard : voir aussi double, attaque2, jet, colere) :
//   prepare = télégraphe avant l'attaque (0 → 1), attaque = le coup lui-même (0 → 1 pendant ~1 temps),
//   touche = 1 au moment où il est touché puis redescend à 0, coule = 0 → 1 quand il est vaincu (il sombre et s'efface).
// Aucun accès à la page, aucun état caché, save/restore autour du dessin.
'use strict';
const MONSTRES = (() => {
  const C = { marine: '#1F2A44', brique: '#B5452F', creme: '#F2E6CC', moutarde: '#E0A82E', vert: '#7FA89A', marine2: '#3C4D6B', sable: '#D9C9A6' };
  const TAU = Math.PI * 2, BEAT = 60 / 102;
  const mix = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const sombre = c => mix(c, C.marine, 0.28), clair = c => mix(c, C.creme, 0.4);
  const frac = v => v - Math.floor(v), clamp = v => Math.max(0, Math.min(1, v));
  const easeOut = x => 1 - (1 - x) * (1 - x), easeIn = x => x * x * x;
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  // Remplissage : quand le monstre est touché, ses couleurs flashent vers le crème
  const K = { flash: 0 };
  function remplis(g, c) { g.fillStyle = K.flash > 0.5 ? clair(c) : c; g.fill(); }
  function trace(g, lw) { g.lineWidth = lw; g.strokeStyle = C.marine; g.stroke(); }
  function rivets(g, pts, r) { g.fillStyle = C.marine; for (const [x, y] of pts) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }
  function oeil(g, lw, x, y, r, regard, etat) {
    // Œil rond crème, pupille marine ; plissé quand il est touché
    g.beginPath(); g.arc(x, y, r, 0, TAU); remplis(g, C.creme); trace(g, lw);
    if (etat.touche > 0.4) { g.strokeStyle = C.marine; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.4); g.lineTo(x + r * 0.5, y); g.lineTo(x - r * 0.6, y + r * 0.4); g.stroke(); return; }
    const p = r * (0.45 + etat.prepare * 0.15);
    g.fillStyle = C.marine; g.beginPath(); g.arc(x + regard * r * 0.25, y, p, 0, TAU); g.fill();
    g.fillStyle = C.creme; g.beginPath(); g.arc(x + regard * r * 0.25 - p * 0.35, y - p * 0.35, p * 0.3, 0, TAU); g.fill();
  }
  function vapeur(g, lw, x, y, t, n, force) {
    for (let i = 0; i < n; i++) {
      const k = frac(t * 0.9 + i / n), r = 2.5 + k * 5 * force;
      g.globalAlpha = (1 - k) * 0.95; g.beginPath(); g.arc(x - k * 10, y - k * 16 * force, r, 0, TAU); g.fillStyle = C.creme; g.fill(); trace(g, lw * 0.7);
    }
    g.globalAlpha = 1;
  }
  function etoiles(g, lw, x, y, k) {
    // Éclat d'impact moutarde
    if (k <= 0.02) return;
    g.strokeStyle = C.moutarde; g.lineWidth = lw * 1.6; g.lineCap = 'round'; g.globalAlpha = clamp(k * 1.8);
    const r = 6 + (1 - k) * 12; g.beginPath();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7)); }
    g.stroke(); g.globalAlpha = 1;
  }
  function remous(g, lw, t, larg) {
    // Petites vaguelettes à la flottaison
    g.strokeStyle = C.creme; g.lineWidth = lw * 1.3; g.lineCap = 'round'; g.beginPath();
    for (let i = -1; i <= 1; i += 2) { const o = Math.sin(t * 3 + i) * 2; g.moveTo(i * larg + o - 6, 1); g.quadraticCurveTo(i * larg + o, -2.5, i * larg + o + 6, 1); }
    g.stroke();
  }

  // ---------- Sardine-à-Vapeur (nageuse) : sardine à hélice, cheminée sur le dos, plaque rivetée sur le front ----------
  function sardine(g, lw, t, s, E) {
    const nage = t * 2.2 + s;
    // Elle saute hors de l'eau de temps en temps ; elle se ramasse avant d'attaquer, puis fonce
    const saut = Math.max(0, Math.sin(nage * 0.5)) ** 3 * 22 * (1 - E.prepare) * (1 - E.attaque);
    const elan = E.attaque > 0 ? Math.sin(E.attaque * Math.PI) * 26 : -E.prepare * 8;
    const ondule = Math.sin(nage * 3) * (0.06 + E.prepare * 0.05);
    g.translate(elan, -22 - saut); g.rotate(-Math.cos(nage * 0.5) * 0.15 * (saut / 22) + E.attaque * Math.sin(E.attaque * Math.PI) * 0.1);
    const corps = () => { g.beginPath(); g.moveTo(40, 0); g.bezierCurveTo(36, -13, 10, -17, -16, -12); g.quadraticCurveTo(-30, -8, -36, -1); g.quadraticCurveTo(-30, 7, -16, 11); g.bezierCurveTo(10, 16, 34, 11, 40, 0); g.closePath(); };
    // Hélice greffée à la place de la queue
    g.save(); g.translate(-38, 0); g.rotate(ondule * 2);
    g.fillStyle = C.marine2; rr(g, -8, -2, 9, 4, 1.5); g.fill(); trace(g, lw);
    const a = nage * 9 + E.attaque * 30;
    for (let i = 0; i < 3; i++) { const c = Math.cos(a + i * TAU / 3); g.beginPath(); g.ellipse(-9, c * 6, 2.6, Math.abs(c) * 6 + 0.8, 0, 0, TAU); remplis(g, C.moutarde); trace(g, lw); }
    g.beginPath(); g.arc(-9, 0, 2, 0, TAU); remplis(g, C.marine2); trace(g, lw);
    g.restore();
    g.save(); g.rotate(ondule);
    corps(); remplis(g, C.vert);
    g.save(); g.clip();
    g.fillStyle = K.flash > 0.5 ? clair(C.marine2) : C.marine2; g.fillRect(-40, -20, 82, 11);      // dos sombre
    g.fillStyle = K.flash > 0.5 ? C.creme : C.creme; g.fillRect(-40, 4, 82, 12);                    // ventre
    g.strokeStyle = sombre(C.vert); g.lineWidth = lw; g.beginPath();
    for (let x = -22; x < 22; x += 7) { g.moveTo(x, -6); g.arc(x - 3.5, -2, 4, -0.9, 0.9); }       // écailles
    g.stroke();
    g.fillStyle = C.marine; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-10 + i * 7, -5.5, 1.2, 0, TAU); g.fill(); } // points de sardine
    g.restore();
    corps(); trace(g, lw);
    // Nageoires
    g.beginPath(); g.moveTo(-6, -13); g.quadraticCurveTo(-12, -24, -20, -22); g.quadraticCurveTo(-16, -16, -14, -12); g.closePath(); remplis(g, C.vert); trace(g, lw);
    g.beginPath(); g.moveTo(8, 6); g.quadraticCurveTo(2, 14 + Math.sin(nage * 4) * 2, -6, 12); g.quadraticCurveTo(0, 8, 2, 6); g.closePath(); remplis(g, sombre(C.vert)); trace(g, lw);
    // Cheminée sur le dos, avec sa vapeur
    g.save(); g.translate(8, -15); g.rotate(-0.25);
    rr(g, -3, -10, 7, 11, 1); remplis(g, C.brique); trace(g, lw);
    rr(g, -4, -12, 9, 3, 1); remplis(g, C.moutarde); trace(g, lw);
    vapeur(g, lw, 0.5, -14, t * (1 + E.prepare * 2), 3, 1 + E.prepare * 0.8);
    g.restore();
    // Plaque rivetée sur le front et branchie
    g.beginPath(); g.moveTo(18, -12); g.quadraticCurveTo(30, -12, 37, -4); g.lineTo(28, 2); g.quadraticCurveTo(22, -4, 16, -3); g.closePath(); remplis(g, C.sable); trace(g, lw);
    rivets(g, [[21, -8], [27, -7], [32, -4]], 1.1);
    g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.moveTo(14, -6); g.quadraticCurveTo(10, 1, 14, 8); g.stroke();
    oeil(g, lw, 27, -2.5, 4.4, 1, E);
    // Bouche : s'ouvre pendant l'attaque
    const ouv = E.attaque > 0 ? Math.sin(E.attaque * Math.PI) * 5 : E.prepare * 2;
    g.beginPath(); g.moveTo(40, 0.5); g.lineTo(33, 2 + ouv * 0.4); g.lineTo(39, 2 + ouv); g.closePath(); remplis(g, C.marine);
    g.restore();
  }

  // ---------- Crache-Boulons (cracheur) : poisson-globe tacheté avec un canon greffé en guise de bouche ----------
  function cracheur(g, lw, t, s, E) {
    const flotte = Math.sin(t * 2 + s) * 2, gonfle = 1 + easeOut(E.prepare) * 0.28 - (E.attaque > 0 ? Math.sin(E.attaque * Math.PI) * 0.12 : 0);
    const recul = E.attaque > 0 ? Math.sin(Math.min(1, E.attaque * 2) * Math.PI) * -9 : 0;
    g.translate(recul, -30 + flotte);
    // Queue et nageoires
    const bat = Math.sin(t * 7 + s) * 0.25;
    g.save(); g.translate(-27 * gonfle, 0); g.rotate(bat);
    g.beginPath(); g.moveTo(2, 0); g.lineTo(-14, -11); g.quadraticCurveTo(-10, 0, -14, 11); g.closePath(); remplis(g, C.vert); trace(g, lw);
    g.restore();
    g.save(); g.scale(gonfle, gonfle);
    // Piquants (ils se dressent quand il gonfle)
    const pq = 4 + easeOut(E.prepare) * 5;
    g.fillStyle = C.marine;
    for (let i = 0; i < 14; i++) { const a = -Math.PI * 0.95 + i / 13 * Math.PI * 1.55; g.beginPath(); g.moveTo(Math.cos(a - 0.08) * 25, Math.sin(a - 0.08) * 25); g.lineTo(Math.cos(a) * (25 + pq), Math.sin(a) * (25 + pq)); g.lineTo(Math.cos(a + 0.08) * 25, Math.sin(a + 0.08) * 25); g.fill(); }
    g.beginPath(); g.arc(0, 0, 26, 0, TAU); remplis(g, C.moutarde);
    g.save(); g.clip();
    g.fillStyle = K.flash > 0.5 ? C.creme : C.creme; g.beginPath(); g.ellipse(2, 18, 26, 13, 0, 0, TAU); g.fill();   // ventre
    g.fillStyle = K.flash > 0.5 ? clair(C.marine2) : C.marine2;
    for (const [x, y, r] of [[-12, -12, 3], [-2, -17, 2.4], [-16, 0, 2.6], [-6, -6, 2], [6, -14, 1.8], [-20, -10, 1.6]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.restore();
    g.beginPath(); g.arc(0, 0, 26, 0, TAU); trace(g, lw);
    // Plaque de blindage rivetée sur le flanc
    g.beginPath(); g.moveTo(-18, 2); g.lineTo(-4, -2); g.lineTo(-2, 12); g.lineTo(-16, 15); g.closePath(); remplis(g, C.sable); trace(g, lw);
    rivets(g, [[-15, 4], [-6, 1.5], [-5, 10], [-14, 12.5]], 1);
    // Nageoire latérale
    g.beginPath(); g.moveTo(6, 6); g.quadraticCurveTo(0, 16 + Math.sin(t * 9) * 2, -6, 12); g.quadraticCurveTo(0, 9, 4, 4); g.closePath(); remplis(g, C.vert); trace(g, lw);
    oeil(g, lw, 10, -11, 6, 1, E);
    g.strokeStyle = C.marine; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(4, -19 - E.prepare * 2); g.lineTo(15, -16 + E.prepare); g.stroke();   // sourcil
    g.restore();
    // Canon greffé à la place de la bouche
    const cx0 = 22 * gonfle;
    g.save(); g.translate(cx0, 3);
    rr(g, -4, -6.5, 22, 13, 2); remplis(g, C.marine2); trace(g, lw);
    rr(g, 15, -8.5, 6, 17, 2); remplis(g, C.marine); trace(g, lw);
    rr(g, 3, -7.5, 3.6, 15, 1); remplis(g, C.moutarde); trace(g, lw * 0.8);
    rivets(g, [[-1, -3.5], [-1, 3.5], [10, -3.5], [10, 3.5]], 0.9);
    // La bouche du canon rougeoie pendant le télégraphe
    g.beginPath(); g.ellipse(21, 0, 1.8, 5.5, 0, 0, TAU); g.fillStyle = E.prepare > 0.05 ? mix(C.marine, C.moutarde, clamp(E.prepare)) : C.marine; g.fill();
    // Tir : flamme et fumée
    if (E.attaque > 0 && E.attaque < 0.7) {
      const k = E.attaque / 0.7;
      g.globalAlpha = 1 - k;
      g.beginPath(); g.moveTo(22, -6); g.lineTo(34 + k * 6, -9); g.lineTo(28, 0); g.lineTo(36 + k * 8, 7); g.lineTo(22, 6); g.closePath(); g.fillStyle = C.moutarde; g.fill(); trace(g, lw);
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(26 + k * 14 + i * 5, -4 + i * 3 - k * 6, 3 + k * 4, 0, TAU); g.fillStyle = C.creme; g.fill(); trace(g, lw * 0.7); }
      g.globalAlpha = 1;
    }
    g.restore();
  }

  // ---------- Bernard-l'Enclume (cogneur) : bernard-l'ermite logé dans une enclume, pince-marteau ----------
  function bernard(g, lw, t, s, E) {
    const flotte = Math.sin(t * 1.6 + s) * 1.5;
    // Pince : se lève pendant le télégraphe, s'abat pendant l'attaque
    const lev = E.attaque > 0 ? (E.attaque < 0.35 ? 1 - easeIn(E.attaque / 0.35) : 0) : easeOut(E.prepare);
    const choc = E.attaque > 0.3 ? Math.exp(-(E.attaque - 0.33) * 9) * (E.attaque > 0.33 ? 1 : 0) : 0;
    g.translate(0, -8 + flotte + choc * 2);
    // Pattes qui pagaient sous l'eau
    for (let i = 0; i < 3; i++) {
      const a = Math.sin(t * 5 + i * 1.7 + s) * 0.35;
      g.save(); g.translate(-4 + i * 9, 2); g.rotate(0.5 + a);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(4, 10); g.lineTo(1, 18); g.strokeStyle = C.marine; g.lineWidth = 4 + lw * 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.strokeStyle = K.flash > 0.5 ? clair(C.brique) : sombre(C.brique); g.lineWidth = 4; g.stroke();
      g.restore();
    }
    // Enclume (la coquille) : corne vers l'arrière, table plate, taille, base
    g.save(); g.translate(-8, -22); g.rotate(-lev * 0.05 + choc * 0.04);
    g.beginPath();
    g.moveTo(-34, -24); g.quadraticCurveTo(-24, -30, -14, -30); g.lineTo(26, -30); g.lineTo(26, -20); g.quadraticCurveTo(14, -19, 12, -12);
    g.lineTo(12, -2); g.lineTo(22, 4); g.lineTo(22, 12); g.lineTo(-22, 12); g.lineTo(-22, 4); g.lineTo(-12, -2); g.lineTo(-12, -12); g.quadraticCurveTo(-14, -18, -24, -20); g.closePath();
    remplis(g, C.marine2); trace(g, lw);
    g.beginPath(); g.moveTo(-14, -30); g.lineTo(26, -30); g.lineTo(26, -27); g.lineTo(-14, -27); g.closePath(); remplis(g, C.sable); trace(g, lw * 0.8);   // table polie
    g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.moveTo(-8, 6); g.lineTo(16, 6); g.stroke();
    g.fillStyle = K.flash > 0.5 ? C.creme : C.moutarde; rr(g, -2, -12, 8, 6, 1); g.fill(); trace(g, lw * 0.8);                                         // plaque moutarde
    rivets(g, [[-18, 9], [18, 9], [0, 9]], 1.1);
    g.fillStyle = sombre(C.marine2); g.beginPath(); g.moveTo(-12, -12); g.lineTo(-12, -2); g.lineTo(-22, 4); g.lineTo(-22, 11); g.lineTo(-16, 11); g.lineTo(-16, 4); g.lineTo(-8, -2); g.lineTo(-8, -12); g.closePath(); g.fill();
    g.restore();
    // Corps de crabe qui sort de l'enclume, vers l'avant
    g.beginPath(); g.moveTo(10, -30); g.quadraticCurveTo(30, -34, 34, -16); g.quadraticCurveTo(34, -2, 18, -2); g.quadraticCurveTo(8, -6, 10, -30); g.closePath(); remplis(g, C.brique); trace(g, lw);
    g.strokeStyle = sombre(C.brique); g.lineWidth = lw; g.beginPath(); g.moveTo(16, -24); g.quadraticCurveTo(24, -22, 28, -16); g.moveTo(14, -16); g.quadraticCurveTo(22, -12, 26, -8); g.stroke();
    // Yeux sur pédoncules
    for (let i = 0; i < 2; i++) {
      const bal = Math.sin(t * 2.6 + i * 1.3 + s) * 0.18 - E.prepare * 0.2;
      g.save(); g.translate(22 + i * 6, -32); g.rotate(bal + (i ? 0.2 : -0.1));
      g.strokeStyle = C.marine; g.lineWidth = 2.6 + lw * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -12); g.stroke(); g.strokeStyle = C.brique; g.lineWidth = 2.6; g.stroke();
      oeil(g, lw, 0, -14, 3.6, 1, E);
      g.restore();
    }
    // Pince-marteau : bras articulé, pince brique, tête de marteau moutarde boulonnée
    g.save(); g.translate(30, -14); g.rotate(0.5 - lev * 2.1 + choc * 0.1);
    g.strokeStyle = C.marine; g.lineWidth = 6 + lw * 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 0); g.stroke(); g.strokeStyle = K.flash > 0.5 ? clair(C.brique) : C.brique; g.lineWidth = 6; g.stroke();
    g.translate(18, 0);
    g.beginPath(); g.ellipse(4, 0, 9, 7, 0, 0, TAU); remplis(g, C.brique); trace(g, lw);
    g.beginPath(); g.moveTo(8, -4); g.quadraticCurveTo(18, -8, 20, -2); g.lineTo(11, -1); g.closePath(); remplis(g, C.brique); trace(g, lw);
    // Marteau
    g.save(); g.translate(13, 3); g.rotate(Math.PI / 2);
    rr(g, -2.4, -2, 4.8, 9, 1); remplis(g, C.sable); trace(g, lw);
    rr(g, -9, 6, 18, 9, 1.6); remplis(g, C.moutarde); trace(g, lw);
    rivets(g, [[-5.5, 10.5], [5.5, 10.5]], 1);
    g.restore();
    g.restore();
    // Impact devant lui
    if (choc > 0.02) etoiles(g, lw, 52, 4, choc);
  }

  // ---------- Tonton Homard (Léviathan de la mer 1) : homard géant, pince-marteau à vapeur, chaudière sur le dos ----------
  // etat en plus : double (0/1, phase 3 : la 2e pince frappe aussi), arme2 (0 → 1, le temps entre les 2 coups : la 2e pince
  // finit de monter plus haut et tremble), attaque2 (0 → 1, 2e coup de la double pince ; garder attaque = 1 après le 1er coup),
  // jet (0 → 1, jet de vapeur de la phase 2), colere (0/1, phase 3 : plus de vapeur, carapace plus sombre)
  function homard(g, lw, t, s, E) {
    const flotte = Math.sin(t * 1.4 + s) * 1.5, col = E.colere ? mix(C.brique, C.marine, 0.15) : C.brique;
    // Levée d'une pince : prepare la lève, attaque l'abat (le coup porte vers attaque = 0,3)
    const leve = (prep, att) => att > 0 ? (att < 0.3 ? 1 - easeIn(att / 0.3) : -Math.exp(-(att - 0.3) * 8) * 0.12) : easeOut(prep);
    const choc = att => att > 0.28 ? Math.exp(-(att - 0.3) * 8) : 0;
    // Double pince (2 temps d'écart) : la 2e pince reste à mi-hauteur pendant l'annonce, monte plus haut et tremble
    // pendant le temps qui sépare les coups (arme2), puis s'abat (attaque2). Le 1er coup et le 2e ne se confondent pas.
    const a2 = E.arme2 || 0, h2 = 0.7 + 0.6 * easeOut(a2);
    const l1 = leve(E.prepare, E.attaque);
    const l2 = !E.double ? 0 : E.attaque2 > 0 ? leve(1, E.attaque2) * 1.3 : easeOut(E.prepare) * h2 + (a2 > 0 && a2 < 1 ? Math.sin(t * 46) * 0.05 : 0);
    const c1 = choc(E.attaque), c2 = E.double ? choc(E.attaque2) : 0;
    g.translate(0, flotte + (c1 + c2 * 1.6) * 2);
    // Pattes sous l'eau
    for (let i = 0; i < 4; i++) {
      const a = Math.sin(t * 4 + i * 1.4 + s) * 0.3;
      g.save(); g.translate(-12 + i * 9, -14); g.rotate(0.35 + a);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(5, 12); g.lineTo(2, 24); g.strokeStyle = C.marine; g.lineWidth = 3.4 + lw * 2; g.stroke(); g.strokeStyle = sombre(col); g.lineWidth = 3.4; g.stroke();
      g.restore();
    }
    // Pince du fond (pince naturelle ; en phase 3 elle frappe aussi)
    // En phase 3, la 2e pince s'éclaircit et grossit quand elle s'arme, et frappe plus bas que le marteau pour rester visible
    const vive = E.double && (a2 > 0 || E.attaque2 > 0), z2 = 1 + 0.18 * (E.attaque2 > 0 ? 1 : easeOut(a2));
    g.save(); g.translate(10, -24); g.scale(z2, z2);
    pinceHomard(g, lw / z2, t, 0, 0, (E.double ? 0.85 : 0.55) - l2 * 1.9 + c2 * 0.1, vive ? col : sombre(col), false);
    g.restore();
    // Queue qui sort de l'eau à l'arrière, en segments, avec l'éventail
    const sway = Math.sin(t * 1.8 + s) * 0.12;
    g.save(); g.translate(-26, -20);
    for (let i = 0; i < 4; i++) {
      g.rotate(-0.16 + sway);
      g.beginPath(); g.ellipse(-7, 0, 9, 8 - i, 0, 0, TAU); remplis(g, col); trace(g, lw);
      g.strokeStyle = sombre(col); g.lineWidth = lw; g.beginPath(); g.moveTo(-6, -6 + i); g.lineTo(-6, 6 - i); g.stroke();
      g.translate(-11, 0);
    }
    g.rotate(-0.2);
    for (const a of [-0.5, 0, 0.5]) { g.save(); g.rotate(a); g.beginPath(); g.ellipse(-8, 0, 9, 4, 0, 0, TAU); remplis(g, col); trace(g, lw); g.restore(); }
    g.restore();
    // Carapace segmentée, plaque de blindage greffée
    const cara = () => { g.beginPath(); g.ellipse(2, -30, 31, 18, -0.05, 0, TAU); };
    cara(); remplis(g, col);
    g.save(); g.clip();
    g.fillStyle = K.flash > 0.5 ? C.creme : sombre(col); g.fillRect(-32, -22, 70, 20);
    g.strokeStyle = sombre(col); g.lineWidth = lw; g.beginPath(); for (const x of [-18, -8, 2]) { g.moveTo(x, -50); g.quadraticCurveTo(x - 4, -30, x, -10); } g.stroke();
    g.restore();
    cara(); trace(g, lw);
    g.beginPath(); g.moveTo(6, -46); g.quadraticCurveTo(22, -46, 30, -36); g.lineTo(22, -28); g.quadraticCurveTo(14, -36, 4, -36); g.closePath(); remplis(g, C.sable); trace(g, lw);
    rivets(g, [[9, -42], [16, -41.5], [22, -38], [10, -38.5]], 1);
    // Chaudière sur le dos, manomètre et cheminée qui siffle
    g.save(); g.translate(-12, -48);
    rr(g, -10, -14, 20, 18, 4); remplis(g, C.moutarde); trace(g, lw);
    g.fillStyle = D2; g.fillRect(-9.5, -6, 19, 2.4);
    rivets(g, [[-7, -11], [7, -11], [-7, 1], [7, 1]], 0.9);
    g.beginPath(); g.arc(0, -4, 4.2, 0, TAU); remplis(g, C.creme); trace(g, lw);
    g.strokeStyle = C.brique; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(0, -4); const aig = -2.4 + E.prepare * 2 + (E.colere ? 0.6 : 0) + Math.sin(t * 13) * 0.08; g.lineTo(Math.cos(aig) * 3.4, -4 + Math.sin(aig) * 3.4); g.stroke();
    rr(g, -14, -26, 6, 14, 1); remplis(g, C.marine2); trace(g, lw);
    rr(g, -15, -28, 8, 3, 1); remplis(g, C.moutarde); trace(g, lw);
    vapeur(g, lw, -11, -30, t * (1 + E.prepare * 2.5 + (E.colere ? 1 : 0)), 3 + Math.round(E.prepare * 2), 1 + E.prepare + (E.colere ? 0.6 : 0));
    g.restore();
    // Tête : rostre, antennes, yeux sur pédoncules qui rougissent pendant l'annonce
    g.beginPath(); g.moveTo(24, -42); g.quadraticCurveTo(40, -44, 46, -36); g.lineTo(32, -28); g.quadraticCurveTo(26, -32, 22, -32); g.closePath(); remplis(g, col); trace(g, lw);
    for (let i = 0; i < 2; i++) {
      const a = Math.sin(t * 1.7 + i * 1.1 + s) * 0.12;
      g.strokeStyle = C.marine; g.lineWidth = 1.6 + lw * 2; g.beginPath(); g.moveTo(40, -40); g.bezierCurveTo(58, -60 - i * 8, 70 + i * 6, -84 + a * 40, 50 + i * 10, -96 + a * 30); g.stroke();
      g.strokeStyle = col; g.lineWidth = 1.6; g.stroke();
    }
    const rouge = clamp(E.prepare * 1.3 + (E.colere ? 0.35 : 0));
    for (let i = 0; i < 2; i++) {
      g.save(); g.translate(30 + i * 6, -42); g.rotate(-0.25 + i * 0.3 + Math.sin(t * 2.2 + i) * 0.1);
      g.strokeStyle = C.marine; g.lineWidth = 2.6 + lw * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -9); g.stroke(); g.strokeStyle = col; g.lineWidth = 2.6; g.stroke();
      if (rouge > 0.05) { g.globalAlpha = rouge * 0.45; g.beginPath(); g.arc(0, -11, 6.5, 0, TAU); g.fillStyle = C.brique; g.fill(); g.globalAlpha = 1; }
      g.beginPath(); g.arc(0, -11, 3.6, 0, TAU); remplis(g, rouge > 0.05 ? mix(C.creme, C.brique, rouge * 0.75) : C.creme); trace(g, lw);
      if (E.touche > 0.4) { g.strokeStyle = C.marine; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(-2, -12.5); g.lineTo(2, -11); g.lineTo(-2, -9.5); g.stroke(); }
      else { g.fillStyle = C.marine; g.beginPath(); g.arc(0.8, -11, 1.8 - rouge * 0.5, 0, TAU); g.fill(); }
      g.restore();
    }
    // Jet de vapeur (phase 2) : souffle crème depuis la bouche, vers l'avant
    if (E.jet > 0 && E.jet < 1) {
      const k = E.jet; g.globalAlpha = Math.sin(k * Math.PI);
      for (let i = 0; i < 6; i++) { const d = (i / 5) * (20 + k * 50); g.beginPath(); g.arc(46 + d, -34 + Math.sin(i * 2 + t * 8) * 2, 3 + d * 0.16, 0, TAU); g.fillStyle = C.creme; g.fill(); trace(g, lw * 0.7); }
      g.globalAlpha = 1;
    }
    // Pince-marteau de devant
    pinceHomard(g, lw, t, 20, -26, 0.55 - l1 * 1.9 + c1 * 0.1, col, true);
    if (c1 > 0.02) etoiles(g, lw, 66, 2, c1);
    if (c2 > 0.02) etoiles(g, lw, 54, 14, Math.min(1, c2 * 1.3));
  }
  const D2 = mix(C.moutarde, C.brique, 0.35);
  function pinceHomard(g, lw, t, x, y, angle, col, marteau) {
    g.save(); g.translate(x, y); g.rotate(angle);
    // Bras en deux segments
    g.strokeStyle = C.marine; g.lineWidth = 7 + lw * 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(18, 0); g.lineTo(30, 0); g.stroke();
    g.strokeStyle = K.flash > 0.5 ? clair(col) : col; g.lineWidth = 7; g.stroke();
    g.fillStyle = C.marine; g.beginPath(); g.arc(18, 0, 1.6, 0, TAU); g.fill();
    g.translate(32, 0);
    if (marteau) {
      // Pince serrée sur un marteau-pilon : cylindre ardoise, tige moutarde, masse moutarde
      g.beginPath(); g.ellipse(4, 0, 11, 8, 0, 0, TAU); remplis(g, col); trace(g, lw);
      g.save(); g.translate(12, 0); g.rotate(Math.PI / 2);
      rr(g, -6, -10, 12, 16, 2); remplis(g, C.marine2); trace(g, lw);
      rr(g, -7, -12, 14, 3.4, 1); remplis(g, C.moutarde); trace(g, lw);
      rr(g, -1.8, 6, 3.6, 6, 0.8); remplis(g, C.sable); trace(g, lw);
      rr(g, -11, 12, 22, 12, 2); remplis(g, C.moutarde); trace(g, lw);
      g.fillStyle = D2; g.fillRect(-10.5, 20, 21, 3.4);
      rivets(g, [[-7, 15.5], [7, 15.5]], 1.1);
      g.restore();
    } else {
      // Pince naturelle, deux mors
      g.beginPath(); g.moveTo(-4, -6); g.quadraticCurveTo(16, -12, 22, -3); g.lineTo(8, -1); g.quadraticCurveTo(2, 2, -4, 6); g.closePath(); remplis(g, col); trace(g, lw);
      g.beginPath(); g.moveTo(0, 3); g.quadraticCurveTo(12, 9, 18, 5); g.lineTo(6, 1); g.closePath(); remplis(g, col); trace(g, lw);
    }
    g.restore();
  }

  const PERSOS = {
    sardine: { f: sardine, k: 1.7, larg: 30, nom: 'Sardine-à-Vapeur' },
    cracheur: { f: cracheur, k: 1.35, larg: 26, nom: 'Crache-Boulons' },
    bernard: { f: bernard, k: 1.2, larg: 30, nom: "Bernard-l'Enclume" },
    homard: { f: homard, k: 1.15, larg: 36, nom: 'Tonton Homard', bpm: 106 },
  };

  function draw(g, nom, x, y, h, t, dir, seed, etat) {
    const D = PERSOS[nom] || PERSOS.sardine;
    const E = { prepare: 0, attaque: 0, attaque2: 0, arme2: 0, touche: 0, coule: 0, double: 0, jet: 0, colere: 0, ...(etat || {}) }, s = seed || 0;
    const lw = Math.max(0.7, 110 / h);
    g.save();
    g.translate(x, y); g.scale((dir || 1) * h / 100, h / 100);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // Vaincu : il penche, sombre et s'efface ; touché : il tremble et ses couleurs flashent
    const c = clamp(E.coule);
    g.globalAlpha = 1 - easeIn(c);
    g.translate(Math.sin(t * 60) * 3 * E.touche, c * 40); g.rotate(c * 0.5);
    K.flash = E.touche;
    if (c < 0.6) remous(g, lw, t, D.larg * D.k);
    g.save(); g.scale(D.k, D.k); D.f(g, lw / D.k, t, s, E); g.restore();
    if (E.touche > 0.05) etoiles(g, lw, 0, -40, E.touche);
    // Bulles quand il coule
    if (c > 0) for (let i = 0; i < 4; i++) { const k = frac(t * 1.3 + i / 4); g.globalAlpha = (1 - easeIn(c)) * (1 - k); g.beginPath(); g.arc(-12 + i * 8, -20 - k * 30, 2 + i % 2, 0, TAU); g.fillStyle = C.creme; g.fill(); trace(g, lw * 0.7); }
    K.flash = 0;
    g.restore();
  }
  return { draw, noms: Object.keys(PERSOS), titres: Object.fromEntries(Object.entries(PERSOS).map(([k, v]) => [k, v.nom])), BEAT };
})();
