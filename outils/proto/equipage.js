// Souquez ! : équipage dessiné en canvas (membres flottants), charte piste 3.
// Contrat : /mnt/project-files/souquez/prog/contrat-equipage-canvas.md
// EQUIPAGE.draw(g, nom, x, y, h, etat, t, dir, seed) : pieds en (x, y), hauteur h px.
'use strict';
const EQUIPAGE = (() => {
  const C = { marine: '#1F2A44', brique: '#B5452F', creme: '#F2E6CC', moutarde: '#E0A82E', vert: '#7FA89A', marine2: '#3C4D6B', sable: '#D9C9A6' };
  const BEAT = 60 / 102, TAU = Math.PI * 2;
  // Teinte du fond : la couleur mélangée à 28 % de marine (calculée une fois)
  const mix = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const F = {}; for (const k in C) F[k] = mix(C[k], C.marine, 0.28);
  const D = { moutarde: mix(C.moutarde, C.brique, 0.35), creme: C.sable };
  const frac = v => v - Math.floor(v);
  const PALE = mix(C.brique, C.creme, 0.45);
  const easeOut = x => 1 - (1 - x) * (1 - x), easeIn = x => x * x * x;

  // ---------- Morceaux de Pépin (unité : 1 = 1 % de la hauteur, x vers la proue) ----------
  function trace(g, lw) { g.lineWidth = lw; g.strokeStyle = C.marine; g.stroke(); }

  function botte(g, lw, fond) {
    const col = fond ? F.moutarde : C.moutarde;
    g.beginPath();
    g.moveTo(-6, -14); g.lineTo(4, -14); g.lineTo(4.6, -7.4);
    g.quadraticCurveTo(12.5, -7.8, 13.6, -2.8); g.quadraticCurveTo(14, 0, 11, 0);
    g.lineTo(-5.5, 0); g.quadraticCurveTo(-7.2, 0, -7, -2.2); g.closePath();
    g.fillStyle = col; g.fill();
    g.save(); g.clip();
    g.fillStyle = fond ? F.marine : C.marine; g.fillRect(-9, -2.4, 26, 4);           // semelle
    g.fillStyle = fond ? mix(D.moutarde, C.marine, 0.28) : D.moutarde; g.fillRect(-9, -14.5, 15, 3.4); // revers
    g.restore();
    trace(g, lw);
  }

  function moufle(g, lw, fond, ecrase) {
    if (ecrase) g.scale(1 + ecrase * 0.18, 1 - ecrase * 0.22);
    const col = fond ? F.vert : C.vert;
    g.fillStyle = col;
    g.beginPath(); g.ellipse(4.2, -1.2, 2.4, 3.4, 0.55, 0, TAU); g.fill(); trace(g, lw); // pouce
    g.beginPath(); g.ellipse(0, 0, 5.4, 6.4, 0, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = fond ? F.creme : C.creme;                                            // poignet tricoté
    g.beginPath(); g.roundRect ? g.roundRect(-4.6, -8.6, 9.2, 3.6, 1.6) : g.rect(-4.6, -8.6, 9.2, 3.6); g.fill(); trace(g, lw);
  }

  function bouee(g, lw, devant) {
    const a = 23, b = 6.2, ep = 6.4, y = 8;
    const L = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    const arc = () => { g.beginPath(); devant ? g.ellipse(0, y, a, b, 0, 0, Math.PI) : g.ellipse(0, y, a, b, 0, Math.PI, TAU); };
    g.lineCap = 'butt';
    arc(); g.strokeStyle = C.marine; g.lineWidth = ep + lw * 2; g.stroke();
    arc(); g.strokeStyle = devant ? C.creme : C.sable; g.lineWidth = ep; g.stroke();
    g.setLineDash([L / 8, L / 8]); g.lineDashOffset = devant ? L / 16 : -L / 16;
    arc(); g.strokeStyle = devant ? C.brique : F.brique; g.stroke();
    g.setLineDash([]);
  }

  function corps(g, lw) {
    const W = 18, top = -19, bot = 19;
    const path = () => {
      g.beginPath(); g.moveTo(0, top);
      g.bezierCurveTo(W * 0.72, top, W, -6, W, 5); g.bezierCurveTo(W, bot - 1, W * 0.55, bot, 0, bot);
      g.bezierCurveTo(-W * 0.55, bot, -W, bot - 1, -W, 5); g.bezierCurveTo(-W, -6, -W * 0.72, top, 0, top); g.closePath();
    };
    path(); g.fillStyle = C.creme; g.fill();
    g.save(); g.clip();
    g.fillStyle = C.marine; for (let y = top + 5; y < 8; y += 6.2) g.fillRect(-W - 2, y, W * 2 + 4, 3.1); // rayures
    g.fillStyle = C.brique; g.fillRect(-W - 2, 9, W * 2 + 4, 14);                                        // culotte
    g.restore();
    g.fillStyle = C.marine; g.beginPath(); g.ellipse(1, top + 1.6, 8.5, 3.4, 0, 0, TAU); g.fill();       // col roulé
    path(); trace(g, lw);
  }

  function tete(g, lw, P) {
    // Mèches dans la nuque
    g.fillStyle = C.marine2; g.beginPath(); g.moveTo(-14, 1); g.lineTo(-17, 8); g.lineTo(-12, 6); g.lineTo(-13, 11); g.lineTo(-8, 7); g.closePath(); g.fill(); trace(g, lw * 0.8);
    // Nez court (dessiné avant le visage pour ne garder que la bosse)
    g.fillStyle = C.creme; g.beginPath(); g.arc(14.2, 4.8, 3.1, 0, TAU); g.fill(); trace(g, lw);
    g.beginPath(); g.ellipse(0, 0, 15, 14.4, 0, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = 'rgba(181,69,47,.28)'; g.beginPath(); g.arc(6.5, 7.5, 2.6, 0, TAU); g.fill();        // joue
    // Bouche
    g.fillStyle = C.marine; g.strokeStyle = C.marine; g.lineWidth = lw; g.lineCap = 'round';
    if (P.bouche === 'o') { g.beginPath(); g.ellipse(9.4, 10.4, 2.6, 3.4, 0, 0, TAU); g.fill(); g.fillStyle = C.brique; g.beginPath(); g.ellipse(9.4, 12, 1.6, 1.2, 0, 0, TAU); g.fill(); }
    else if (P.bouche === 'souffle') { g.beginPath(); g.ellipse(10.2, 10, 1.5, 1.8, 0, 0, TAU); g.fill(); }
    else if (P.bouche === 'rire') { g.beginPath(); g.moveTo(6.4, 9); g.quadraticCurveTo(9.5, 12.6, 12.4, 8.6); g.stroke(); }
    else { g.beginPath(); g.moveTo(7, 10); g.quadraticCurveTo(9.4, 11, 11.6, 9.8); g.stroke(); }
    // Bonnet trop grand : pointe qui retombe en arrière (animée), dôme, revers côtelé
    g.save(); g.translate(-5, -17); g.rotate(-P.flop);
    g.beginPath(); g.moveTo(10, 0); g.bezierCurveTo(4, -10, -18, -10, -25, 4);
    g.quadraticCurveTo(-26.5, 9.5, -22, 10.5); g.bezierCurveTo(-14, 4, -4, 6, 2, 8); g.closePath();
    g.fillStyle = C.marine; g.fill(); trace(g, lw);
    g.strokeStyle = C.marine2; g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(4, 0); g.quadraticCurveTo(-9, -5, -19, 4); g.stroke();
    g.restore();
    g.beginPath(); g.moveTo(-18, 0); g.bezierCurveTo(-19, -15, -9, -22, 2, -22); g.bezierCurveTo(13, -22, 18.5, -13, 18, 0); g.closePath();
    g.fillStyle = C.marine; g.fill(); trace(g, lw);
    g.strokeStyle = C.marine2; g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(-8, -18); g.quadraticCurveTo(-3, -9, -4, -3); g.moveTo(6, -19); g.quadraticCurveTo(10, -10, 9, -3); g.stroke();
    g.beginPath(); g.roundRect ? g.roundRect(-19, -5, 38.5, 10, 3.6) : g.rect(-19, -5, 38.5, 10);
    g.fillStyle = C.marine; g.fill();
    g.save(); g.clip(); g.fillStyle = C.marine2; for (let x = -17; x < 20; x += 3.3) g.fillRect(x, -6, 1.4, 12); g.restore();
    trace(g, lw);
    // Pompon en touffe, accroché au bout de la pointe (même repère que la pointe, dessiné par-dessus)
    g.save(); g.translate(-5, -17); g.rotate(-P.flop); g.translate(-24.5, 8.5); g.rotate(P.flop * 1.6);
    const touffe = () => { g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = i % 2 ? 2.5 : 2.8; g.moveTo(Math.cos(a) * r + 2.5, Math.sin(a) * r); g.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, TAU); } };
    touffe(); g.strokeStyle = C.marine; g.lineWidth = lw * 2; g.stroke();
    touffe(); g.fillStyle = C.brique; g.fill();
    g.strokeStyle = PALE; g.lineWidth = lw * 0.9; g.lineCap = 'round'; g.beginPath();
    g.arc(0, 0, 2.9, -2.6, -1.4); g.stroke();
    g.restore();
  }

  function tambour(g, lw, coup) {
    // Petit tambour suspendu devant Pépin ; centre du dessus en (0, 0)
    g.fillStyle = C.brique; g.beginPath(); g.rect(-11, 0, 22, 13); g.fill(); trace(g, lw);
    g.strokeStyle = C.creme; g.lineWidth = lw * 1.1; g.beginPath();
    for (let i = 0; i < 4; i++) { const x = -11 + i * 5.5; g.moveTo(x, 2.5); g.lineTo(x + 5.5, 10.5); g.moveTo(x + 5.5, 2.5); g.lineTo(x, 10.5); } g.stroke();
    g.fillStyle = C.moutarde; g.fillRect(-11.8, -0.4, 23.6, 3); g.fillRect(-11.8, 11, 23.6, 3);
    g.beginPath(); g.rect(-11.8, -0.4, 23.6, 3); g.rect(-11.8, 11, 23.6, 3); trace(g, lw * 0.8);
    g.beginPath(); g.ellipse(0, 0, 11.8, 2.8, 0, 0, TAU); g.fillStyle = coup > 0.35 ? C.moutarde : C.creme; g.fill(); trace(g, lw);
    if (coup > 0.02) {                                                                            // éclat de la frappe
      g.strokeStyle = C.moutarde; g.lineWidth = lw * 1.4; g.lineCap = 'round'; g.globalAlpha = Math.min(1, coup * 2);
      const r = 12 + (1 - coup) * 10; g.beginPath();
      for (const a of [-2.75, -2.25, -1.57, -0.9, -0.4]) { g.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.8 - 3); g.lineTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6) * 0.8 - 3); }
      g.stroke();
      g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.ellipse(0, 0, 11.8 + (1 - coup) * 8, 2.8 + (1 - coup) * 2, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.globalAlpha = 1;
    }
  }

  function goutte(g, lw, k) {
    g.beginPath(); g.moveTo(0, -4.5); g.quadraticCurveTo(3.4, 0, 2.6, 2); g.arc(0, 2, 2.6, 0, Math.PI); g.quadraticCurveTo(-3.4, 0, 0, -4.5);
    g.fillStyle = C.vert; g.fill(); trace(g, lw);
    g.fillStyle = C.creme; g.beginPath(); g.arc(-0.9, 1.4, 0.9, 0, TAU); g.fill();
  }

  // ---------- Poses (fonction pure du temps) ----------
  function pose(etat, t, seed) {
    const s = seed || 0, P = {
      corps: [0, -36, 0, 1, 1], tete: [4, -74, 0],
      main: [[-31, -33, 0.15], [31, -33, -0.15]], pied: [[-9, 0, 0], [7, 0, 0]],
      flop: 0, bouche: 'calme', gouttes: false, tambour: -1, ombre: 1,
    };
    if (etat === 'course' || etat === 'panique') {
      const pan = etat === 'panique', ph = (t + s * 0.31) * TAU * (pan ? 2.3 : 1.7);
      for (let i = 0; i < 2; i++) {
        const p = ph + i * Math.PI, up = Math.max(0, Math.sin(p));
        // Le pied avance en l'air (sin > 0) et recule au sol : x = -cos
        P.pied[i] = [(i ? 4 : -3) - Math.cos(p) * (pan ? 13 : 12), -up * (pan ? 10 : 8), -0.3 * up];
      }
      const rebond = Math.abs(Math.sin(ph));
      P.corps = [2, -37 - rebond * 3, pan ? 0.03 * Math.sin(t * 31) : 0.11, 1 + rebond * 0.02, 1 - rebond * 0.03 + 0.03];
      P.tete = [pan ? 3 + Math.sin(t * 37) * 0.9 : 8, (pan ? -68 : -75) - Math.abs(Math.sin(ph - 0.5)) * 3.2, pan ? -0.08 : 0.1];
      if (pan) {
        // Mains au-dessus de la tête, qui s'agitent vite et en décalé
        for (let i = 0; i < 2; i++) { const a = t * 21 + i * 2.1 + s; P.main[i] = [(i ? 24 : -21) + Math.sin(a) * 4, -103 + Math.cos(a * 1.3) * 3.5 + (i ? 1.5 : 0), Math.PI + Math.sin(a) * 0.55]; }
        P.flop = 0.25 + Math.sin(t * 15) * 0.35; P.bouche = 'o'; P.gouttes = true;
      } else {
        // Chaque main balance à l'opposé du pied du même côté
        for (let i = 0; i < 2; i++) { const p = ph + i * Math.PI, av = Math.cos(p); P.main[i] = [(i ? 28 : -25) + av * 10, -34 - Math.max(0, av) * 4, -av * 0.5]; }
        P.flop = 0.22 + Math.abs(Math.sin(ph - 0.9)) * 0.18; P.bouche = 'souffle';
      }
      P.ombre = 1 - rebond * 0.08;
    } else if (etat === 'tambour') {
      // Frappe pile sur le temps : main qui rebondit, reste en l'air, puis redescend très vite
      const beat = t / BEAT, k = frac(beat), sq = Math.exp(-k * 9), nod = Math.exp(-Math.max(0, k - 0.05) * 7);
      P.corps = [0, -36 + sq * 1.6, 0.07 + sq * 0.05, 1 + sq * 0.05, 1 - sq * 0.07];
      P.tete = [5 + sq * 1.2, -74 + nod * 3, 0.06 + nod * 0.1];
      P.ecrase = [0, 0];
      for (let j = 0; j < 2; j++) {
        const q = frac((beat - j) / 2);
        const L = q < 0.18 ? 19 * easeOut(q / 0.18) : q < 0.84 ? 19 + 3 * (q - 0.18) / 0.66 : 22 * (1 - easeIn((q - 0.84) / 0.16));
        P.main[j] = [(j ? 44 : 33) - L * 0.12, -38.5 - L, -0.35 + L * 0.012];
        P.ecrase[j] = q < 0.06 ? 1 - q / 0.06 : 0;
      }
      P.pied[1] = [7, 0, -0.3 * Math.sin(Math.PI * Math.min(1, k * 1.4))];
      P.flop = 0.05 + nod * 0.3; P.bouche = k < 0.25 ? 'o' : 'rire'; P.tambour = sq;
    } else {
      const tt = t + s * 0.37, br = Math.sin(tt * 2.2);
      P.corps = [0, -36 - br * 0.6, 0, 1 - br * 0.008, 1 + br * 0.018];
      P.tete = [4, -74 - Math.sin(tt * 2.2 - 0.6) * 1, Math.sin(tt * 0.9) * 0.035];
      const hb = Math.sin(tt * 2.2 - 0.9) * 1.2;
      P.main = [[-31, -33 - hb, 0.15 + br * 0.04], [31, -33 - hb, -0.15 - br * 0.04]];
      P.flop = Math.sin(tt * 1.1) * 0.07;
    }
    return P;
  }

  // ---------- Dessin ----------
  function pepin(g, h, etat, t, seed) {
    const P = pose(etat, t, seed), lw = Math.max(0.7, 110 / h);
    const at = (p, fn) => { g.save(); g.translate(p[0], p[1]); g.rotate(p[2] || 0); if (p[3]) g.scale(p[3], p[4]); fn(); g.restore(); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = 'rgba(31,42,68,.16)'; g.beginPath(); g.ellipse(2, 0.5, 21 * P.ombre, 2.6, 0, 0, TAU); g.fill();
    at(P.pied[0], () => botte(g, lw, true));
    at(P.main[0], () => moufle(g, lw, true, P.ecrase && P.ecrase[0]));
    at(P.corps, () => { bouee(g, lw, false); corps(g, lw); bouee(g, lw, true); });
    at(P.tete, () => tete(g, lw, P));
    if (P.gouttes) for (let i = 0; i < 2; i++) {
      const q = frac(t * 1.7 + i * 0.5); g.globalAlpha = q < 0.7 ? 1 : (1 - q) / 0.3;
      at([P.tete[0] + (i ? 1 : -1) * (19 + q * 13), P.tete[1] - 4 - Math.sin(q * Math.PI) * 6 + q * 12, (i ? 0.5 : -0.5) + q * (i ? 0.5 : -0.5)], () => goutte(g, lw, q));
      g.globalAlpha = 1;
    }
    at(P.pied[1], () => botte(g, lw, false));
    if (P.tambour >= 0) at([38, -32 + P.tambour * 1.4], () => tambour(g, lw, P.tambour));
    at(P.main[1], () => moufle(g, lw, false, P.ecrase && P.ecrase[1]));
  }

  const PERSOS = { pepin };
  function draw(g, nom, x, y, h, etat, t, dir, seed) {
    g.save();
    g.translate(x, y); g.scale((dir || 1) * h / 100, h / 100);
    (PERSOS[nom] || pepin)(g, h, etat, t, seed || 0);
    g.restore();
  }
  return { draw, BEAT, noms: Object.keys(PERSOS), etats: ['repos', 'course', 'panique', 'tambour'] };
})();
