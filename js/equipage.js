// Souquez ! : équipage de la Grondeuse dessiné en canvas (membres flottants), charte piste 3.
// Contrat : /mnt/project-files/souquez/prog/contrat-equipage-canvas.md
// EQUIPAGE.draw(g, nom, x, y, h, etat, t, dir, seed) : pieds en (x, y), hauteur h px.
// Noms : pepin, hortense, gaston, bouillon, matelot. États : repos, course, panique, tambour.
'use strict';
const EQUIPAGE = (() => {
  const C = { marine: '#1F2A44', brique: '#B5452F', creme: '#F2E6CC', moutarde: '#E0A82E', vert: '#7FA89A', marine2: '#3C4D6B', sable: '#D9C9A6' };
  const BEAT = 60 / 102, TAU = Math.PI * 2;
  // Teinte du fond : la couleur mélangée à 28 % de marine
  const mix = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const sombre = c => mix(c, C.marine, 0.28);
  const F = {}; for (const k in C) F[k] = sombre(C[k]);
  const D = { moutarde: mix(C.moutarde, C.brique, 0.35), creme: C.sable };
  const frac = v => v - Math.floor(v);
  const PALE = mix(C.brique, C.creme, 0.45);
  const easeOut = x => 1 - (1 - x) * (1 - x), easeIn = x => x * x * x;
  function trace(g, lw) { g.lineWidth = lw; g.strokeStyle = C.marine; g.stroke(); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
  function bouche(g, lw, P, x, y, k) {
    // Bouche commune : calme, souffle (course), o (panique), rire (tambour) ; k = taille
    g.fillStyle = C.marine; g.strokeStyle = C.marine; g.lineWidth = lw; g.lineCap = 'round';
    if (P.bouche === 'o') { g.beginPath(); g.ellipse(x, y + 0.6 * k, 2.2 * k, 3 * k, 0, 0, TAU); g.fill(); g.fillStyle = C.brique; g.beginPath(); g.ellipse(x, y + 2 * k, 1.4 * k, 1 * k, 0, 0, TAU); g.fill(); }
    else if (P.bouche === 'souffle') { g.beginPath(); g.ellipse(x + 0.6, y, 1.4 * k, 1.7 * k, 0, 0, TAU); g.fill(); }
    else if (P.bouche === 'rire') { g.beginPath(); g.moveTo(x - 3.2 * k, y - 1); g.quadraticCurveTo(x, y + 3.6 * k, x + 3 * k, y - 1.4); g.closePath(); g.fill(); g.fillStyle = C.creme; g.fillRect(x - 2.4 * k, y - 1.1, 4.6 * k, 1.1 * k); }
    else { g.beginPath(); g.moveTo(x - 2.4 * k, y); g.quadraticCurveTo(x, y + 1.2 * k, x + 2.2 * k, y - 0.3); g.stroke(); }
  }

  // ---------- Morceaux communs ----------
  // Chaussure : origine au sol sous la cheville, pointe vers +x ; haut = hauteur de la tige
  function chaussure(g, lw, fond, o) {
    const H = o.haut || 14, col = fond ? sombre(o.col) : o.col;
    g.beginPath();
    g.moveTo(-6, -H); g.lineTo(4, -H); g.lineTo(4.6, -7.4);
    g.quadraticCurveTo(12.5, -7.8, 13.6, -2.8); g.quadraticCurveTo(14, 0, 11, 0);
    g.lineTo(-5.5, 0); g.quadraticCurveTo(-7.2, 0, -7, -2.2); g.closePath();
    g.fillStyle = col; g.fill();
    g.save(); g.clip();
    g.fillStyle = fond ? sombre(o.sole) : o.sole; g.fillRect(-9, -2.4, 26, 4);
    if (o.revers) { g.fillStyle = fond ? sombre(o.revers) : o.revers; g.fillRect(-9, -H - 0.5, 15, 3.4); }
    if (o.lacets) { g.strokeStyle = fond ? sombre(o.lacets) : o.lacets; g.lineWidth = lw * 0.9; g.beginPath(); for (let y = -H + 4; y < -5; y += 2.6) { g.moveTo(1, y); g.lineTo(4.5, y + 1.2); } g.stroke(); }
    g.restore();
    trace(g, lw);
  }
  // Main flottante (moufle, gant ou main nue) : doigts vers le bas (+y), pouce vers +x, poignet en haut
  // ecrase : 0..1 à l'impact ; plat : la main frappe à plat (écrasement vertical une fois tournée)
  function main(g, lw, fond, o, ecrase, plat) {
    if (ecrase) plat ? g.scale(1 - ecrase * 0.26, 1 + ecrase * 0.2) : g.scale(1 + ecrase * 0.18, 1 - ecrase * 0.22);
    const col = fond ? sombre(o.col) : o.col, r = o.r || 1;
    g.fillStyle = col;
    g.beginPath(); g.ellipse(4.2 * r, -1.2 * r, 2.4 * r, 3.4 * r, 0.55, 0, TAU); g.fill(); trace(g, lw);
    g.beginPath(); g.ellipse(0, 0, 5.4 * r, 6.4 * r, 0, 0, TAU); g.fill(); trace(g, lw);
    if (o.doigts) { g.strokeStyle = fond ? sombre(C.marine2) : C.marine2; g.lineWidth = lw * 0.8; g.beginPath(); g.moveTo(-2 * r, 3 * r); g.lineTo(-2 * r, 6 * r); g.moveTo(0.8 * r, 3.4 * r); g.lineTo(0.8 * r, 6.3 * r); g.stroke(); }
    if (o.poignet) { g.fillStyle = fond ? sombre(o.poignet) : o.poignet; rr(g, -4.6 * r, -8.6 * r, 9.2 * r, 3.6 * r, 1.6); g.fill(); trace(g, lw); }
  }
  // Corps en œuf : W demi-largeur, top et bot en y
  function oeuf(g, W, top, bot) {
    g.beginPath(); g.moveTo(0, top);
    g.bezierCurveTo(W * 0.72, top, W, top * 0.3, W, top + (bot - top) * 0.63); g.bezierCurveTo(W, bot - 1, W * 0.55, bot, 0, bot);
    g.bezierCurveTo(-W * 0.55, bot, -W, bot - 1, -W, top + (bot - top) * 0.63); g.bezierCurveTo(-W, top * 0.3, -W * 0.72, top, 0, top); g.closePath();
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
  function corpsPepin(g, lw) {
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
  function tetePepin(g, lw, P) {
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

  // ---------- La Bosco Hortense : très grande et sèche, nez vers l'horizon, casquette, manteau brique, sifflet ----------
  function corpsHortense(g, lw, P) {
    const path = () => {
      g.beginPath(); g.moveTo(-8, -21); g.quadraticCurveTo(0, -24, 8, -21); g.lineTo(11, -14); g.lineTo(15, 25);
      g.quadraticCurveTo(15, 27.5, 12.5, 27.5); g.lineTo(-12.5, 27.5); g.quadraticCurveTo(-15, 27.5, -15, 25); g.lineTo(-11, -14); g.closePath();
    };
    path(); g.fillStyle = C.brique; g.fill();
    g.save(); g.clip();
    g.fillStyle = sombre(C.brique); g.fillRect(-16, -25, 7, 55);                                      // ombre du dos, en aplat
    g.fillStyle = C.marine; g.fillRect(-16, 3, 32, 4.2);                                             // ceinture
    g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.moveTo(3.5, -19); g.lineTo(6.5, 27.5); g.moveTo(-10, 12); g.lineTo(-11, 27.5); g.stroke(); // revers et fente
    g.restore();
    g.fillStyle = C.moutarde; rr(g, 2, 2.6, 4.6, 5, 1); g.fill(); trace(g, lw * 0.8);                 // boucle
    for (const [x, y] of [[0.5, -11], [0.8, -4], [1.6, 12], [2, 19]]) { g.beginPath(); g.arc(x, y, 1.5, 0, TAU); g.fillStyle = C.moutarde; g.fill(); trace(g, lw * 0.7); }
    path(); trace(g, lw);
    g.fillStyle = C.marine; rr(g, -7.5, -25.5, 15.5, 6.5, 2.4); g.fill(); trace(g, lw);              // col haut
    g.fillStyle = C.moutarde; rr(g, -3, -22.5, 9, 3, 1.4); g.fill(); trace(g, lw * 0.8);              // épaulette
    // Sifflet au bout d'un cordon crème, qui balance
    g.save(); g.translate(5, -19); g.rotate(-(P.balance || 0));
    g.strokeStyle = C.creme; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(4, 7, 4, 12); g.stroke();
    g.translate(4, 13.5); g.rotate(0.25);
    g.fillStyle = C.moutarde; rr(g, -2, -1.6, 7, 3.6, 1.6); g.fill(); trace(g, lw * 0.8);
    g.beginPath(); g.arc(-1.4, 0.4, 2.4, 0, TAU); g.fill(); trace(g, lw * 0.8);
    g.fillStyle = C.marine; g.beginPath(); g.arc(-1.4, 0.4, 0.8, 0, TAU); g.fill();
    g.restore();
  }
  function teteHortense(g, lw, P) {
    g.rotate(-0.08);                                                                                  // le nez pointe vers l'horizon
    g.fillStyle = C.marine2; g.beginPath(); g.arc(-9.6, 0, 4.6, 0, TAU); g.fill(); trace(g, lw);      // chignon
    g.fillStyle = C.creme; g.beginPath(); g.moveTo(6, -3.5); g.lineTo(19.5, -8.5); g.quadraticCurveTo(20.6, -7, 18.8, -5.4); g.lineTo(7, 4); g.closePath(); g.fill(); trace(g, lw);
    g.beginPath(); g.ellipse(0, 0, 9.2, 11.2, 0, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = C.marine; g.strokeStyle = C.marine; g.lineWidth = lw * 1.1; g.lineCap = 'round';
    const pan = P.bouche === 'o';
    g.beginPath(); g.arc(4.6, -2.6, pan ? 1.7 : 1.25, 0, TAU); g.fill();
    g.beginPath(); pan ? (g.moveTo(2, -8), g.lineTo(7.4, -8.6)) : (g.moveTo(1.6, -6.8), g.lineTo(7.6, -4.6)); g.stroke(); // sourcil froncé
    g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(2.8, 1.6); g.lineTo(5, 2.4); g.stroke();             // ride
    if (P.bouche === 'calme') { g.lineWidth = lw; g.beginPath(); g.moveTo(3, 6.4); g.quadraticCurveTo(5.5, 4.8, 8, 6.4); g.stroke(); }
    else if (P.bouche === 'rire') { g.lineWidth = lw; g.beginPath(); g.moveTo(3, 5.8); g.lineTo(8.2, 5.4); g.stroke(); }
    else bouche(g, lw, P, 5.8, 5.8, 0.8);
    // Casquette à visière
    g.fillStyle = C.marine; g.beginPath(); g.moveTo(-10, -7); g.lineTo(-11.5, -14.5); g.quadraticCurveTo(-1, -19.5, 11.5, -14); g.lineTo(9.5, -6.5); g.closePath(); g.fill(); trace(g, lw);
    g.fillStyle = C.creme; g.fillRect(-10.2, -9.6, 20, 1.6);
    g.fillStyle = C.moutarde; g.beginPath(); g.arc(5, -12.6, 2, 0, TAU); g.fill(); trace(g, lw * 0.7);
    g.fillStyle = C.marine; g.beginPath(); g.moveTo(7, -7.4); g.quadraticCurveTo(14, -8.4, 17.5, -5.2); g.quadraticCurveTo(12, -4.4, 7, -5); g.closePath(); g.fill(); trace(g, lw);
  }

  // ---------- Gaston Piston : maigre comme une clé à molette, suie, lunettes moutarde, salopette, clé géante ----------
  function cleGaston(g, lw) { g.save(); g.translate(-3, -6); g.rotate(-0.35); g.scale(0.8, 0.8); cleSeule(g, lw / 0.8); g.restore(); }
  function cleSeule(g, lw) {
    g.fillStyle = C.sable;
    g.beginPath(); g.moveTo(-2.6, -24); g.lineTo(-7, -31); g.lineTo(-6, -39); g.lineTo(-2.2, -39); g.lineTo(-2.2, -33.5); g.lineTo(2.2, -33.5); g.lineTo(2.2, -39); g.lineTo(6, -39); g.lineTo(7, -31); g.lineTo(2.6, -24); g.closePath(); g.fill(); trace(g, lw);
    rr(g, -2.8, -25, 5.6, 47, 2.6); g.fill(); trace(g, lw);
    g.beginPath(); g.arc(0, 21, 4.4, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = C.marine2; g.beginPath(); g.arc(0, 21, 1.6, 0, TAU); g.fill();
    g.strokeStyle = C.creme; g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(-0.8, -20); g.lineTo(-0.8, 14); g.stroke();
  }
  function corpsGaston(g, lw) {
    const path = () => oeuf(g, 10, -18, 18);
    path(); g.fillStyle = C.creme; g.fill();
    g.save(); g.clip();
    g.fillStyle = C.vert; g.fillRect(-12, -1, 24, 20); rr(g, -4, -11, 12, 11, 1.5); g.fill();   // salopette
    g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.rect(-4, -11, 12, 11); g.moveTo(-12, -1); g.lineTo(-4, -1); g.moveTo(8, -1); g.lineTo(12, -1); g.stroke();
    g.fillStyle = C.vert; g.beginPath(); g.moveTo(1, -19); g.lineTo(4.4, -19); g.lineTo(6.4, -10); g.lineTo(3.2, -10); g.closePath(); g.fill(); trace(g, lw); // bretelle
    g.fillStyle = sombre(C.vert); g.fillRect(-12, -1, 5, 20);                                        // ombre du dos
    g.fillStyle = C.brique; rr(g, -1, 7, 6.4, 6, 0.8); g.fill(); trace(g, lw * 0.8);                 // pièce rapiécée
    g.strokeStyle = C.creme; g.lineWidth = lw * 0.6; g.setLineDash([1, 1.2]); g.beginPath(); g.rect(0, 8, 4.4, 4); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.marine2; for (const [x, y, r] of [[-6, -9, 2.2], [-3, -14, 1.3], [7, 3, 1.7]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } // suie
    g.restore();
    g.fillStyle = C.moutarde; g.beginPath(); g.arc(4.8, -8.4, 1.2, 0, TAU); g.fill(); trace(g, lw * 0.7);
    path(); trace(g, lw);
  }
  function teteGaston(g, lw, P) {
    // Cheveux en épis
    g.fillStyle = C.marine; g.beginPath(); g.moveTo(-10, -1); g.lineTo(-13, -7); g.lineTo(-9.5, -8); g.lineTo(-10.5, -14); g.lineTo(-5, -11.5); g.lineTo(-3.5, -17); g.lineTo(0.5, -12.5); g.lineTo(4, -16.5); g.lineTo(5, -11); g.lineTo(9, -13); g.lineTo(8.5, -6); g.closePath(); g.fill(); trace(g, lw);
    g.fillStyle = C.creme; g.beginPath(); g.arc(10.6, 1.6, 2.7, 0, TAU); g.fill(); trace(g, lw);    // nez
    g.beginPath(); g.ellipse(0, 0, 10, 11.6, 0, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = C.marine2; g.beginPath(); g.ellipse(-3, 5, 2.8, 1.8, 0.3, 0, TAU); g.fill(); g.beginPath(); g.arc(7.4, 6, 1.1, 0, TAU); g.fill(); // suie
    g.fillStyle = C.marine; g.strokeStyle = C.marine; g.lineWidth = lw; g.lineCap = 'round';
    g.beginPath(); g.arc(5.2, -0.8, P.bouche === 'o' ? 1.7 : 1.3, 0, TAU); g.fill();
    g.beginPath(); g.arc(5, -2, 2.8, -2.6, -0.7); g.stroke();                                        // sourcil enthousiaste
    if (P.bouche === 'calme' || P.bouche === 'rire') { g.beginPath(); g.moveTo(2.6, 4.6); g.quadraticCurveTo(6.4, 10.6, 10, 4.6); g.closePath(); g.fill(); g.fillStyle = C.creme; g.fillRect(3.6, 4.6, 5.6, 1.4); }
    else bouche(g, lw, P, 6.6, 6.2, 0.9);
    // Sangle et lunettes moutarde relevées sur le front
    g.fillStyle = C.marine; g.beginPath(); g.moveTo(-10.4, -4.6); g.lineTo(9.6, -7.6); g.lineTo(9.8, -5.2); g.lineTo(-10.2, -2.4); g.closePath(); g.fill();
    g.fillStyle = C.moutarde; g.beginPath(); g.arc(4.6, -8.2, 4.2, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = C.marine2; g.beginPath(); g.arc(4.6, -8.2, 2.5, 0, TAU); g.fill();
    g.fillStyle = C.creme; g.beginPath(); g.arc(3.6, -9.2, 0.8, 0, TAU); g.fill();
  }

  // ---------- Doc Bouillon : ronde, toque très haute, tablier crème à croix brique, louche ----------
  function corpsBouillon(g, lw) {
    const W = 21, path = () => oeuf(g, W, -19, 19);
    // Nœud du tablier dans le dos
    g.fillStyle = C.creme; g.beginPath(); g.ellipse(-22, -6, 4, 2.4, -0.5, 0, TAU); g.fill(); trace(g, lw); g.beginPath(); g.ellipse(-22, -1, 4, 2.4, 0.5, 0, TAU); g.fill(); trace(g, lw);
    path(); g.fillStyle = C.marine2; g.fill();
    g.save(); g.clip();
    g.fillStyle = C.marine; g.fillRect(-W - 2, -20, 6, 42);                                          // ombre du dos
    g.fillStyle = C.creme; g.beginPath(); g.moveTo(-2, -15); g.lineTo(13, -15); g.quadraticCurveTo(W + 4, 0, W + 2, 21); g.lineTo(-6, 21); g.quadraticCurveTo(-7, 2, -2, -15); g.closePath(); g.fill(); trace(g, lw); // tablier
    g.fillStyle = C.brique; g.fillRect(6.2, -2, 3, 11); g.fillRect(2.2, 2, 11, 3);                   // croix
    g.fillStyle = C.creme; g.fillRect(-W - 2, -5.5, W * 2 + 4, 2.6); g.strokeStyle = C.marine; g.lineWidth = lw * 0.8; g.strokeRect(-W - 2, -5.5, W * 2 + 4, 2.6); // cordon
    g.restore();
    g.fillStyle = C.creme; g.beginPath(); g.ellipse(1, -17.6, 9, 3.2, 0, 0, TAU); g.fill(); trace(g, lw); // col
    path(); trace(g, lw);
  }
  function loucheBouillon(g, lw) {
    // Glissée dans le cordon du tablier, devant
    g.lineCap = 'round';
    g.strokeStyle = C.marine; g.lineWidth = 3 + lw * 2; g.beginPath(); g.moveTo(15, 3); g.lineTo(20.5, -21); g.stroke();
    g.strokeStyle = C.sable; g.lineWidth = 3; g.stroke();
    g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.arc(19.4, -22.4, 2.2, 0.6, 3.9); g.stroke();
    g.fillStyle = C.moutarde; g.beginPath(); g.moveTo(9.4, 3); g.lineTo(20.6, 3); g.arc(15, 3, 5.6, 0, Math.PI); g.closePath(); g.fill(); trace(g, lw);
    g.fillStyle = D.moutarde; g.fillRect(9.6, 3, 11, 1.4);
  }
  function teteBouillon(g, lw, P) {
    g.fillStyle = C.marine2; for (const [x, y, r] of [[-11.5, -3, 4], [-12.4, 3, 3.6], [-9.6, 8, 3]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); trace(g, lw); } // boucles
    g.fillStyle = C.creme; g.beginPath(); g.arc(13.2, 3, 3.2, 0, TAU); g.fill(); trace(g, lw);
    g.beginPath(); g.arc(0, 0, 13.4, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = 'rgba(181,69,47,.3)'; g.beginPath(); g.arc(6, 6.4, 3, 0, TAU); g.fill();
    g.fillStyle = C.marine; g.strokeStyle = C.marine; g.lineWidth = lw; g.lineCap = 'round';
    g.beginPath(); g.arc(6.4, -1, P.bouche === 'o' ? 1.7 : 1.3, 0, TAU); g.fill();
    g.beginPath(); g.arc(6.4, -1.6, 3, -2.5, -0.9); g.stroke();
    if (P.bouche === 'calme') { g.beginPath(); g.moveTo(6.4, 8.4); g.quadraticCurveTo(9, 10.6, 11.6, 8); g.stroke(); }
    else bouche(g, lw, P, 9, 9, 0.9);
    // Toque très haute, plissée
    g.fillStyle = C.creme;
    g.beginPath(); g.moveTo(-11, -9); g.lineTo(-12.6, -27); g.quadraticCurveTo(-15, -36, -7, -35.4); g.quadraticCurveTo(-3, -40.5, 3, -36.6); g.quadraticCurveTo(11.5, -39, 12.8, -29); g.lineTo(11.6, -9); g.closePath(); g.fill(); trace(g, lw);
    g.strokeStyle = C.sable; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(-5, -12); g.lineTo(-6, -33); g.moveTo(1, -12); g.lineTo(1, -35); g.moveTo(7, -12); g.lineTo(7.6, -33); g.stroke();
    rr(g, -12, -14.5, 24.4, 7, 2.4); g.fillStyle = C.creme; g.fill(); trace(g, lw);
  }

  // ---------- Matelot générique : longiligne, long nez, bonnet plat, maillot rayé ----------
  function corpsMatelot(g, lw) {
    const W = 13, path = () => oeuf(g, W, -19, 19);
    path(); g.fillStyle = C.creme; g.fill();
    g.save(); g.clip();
    g.fillStyle = C.marine; for (let y = -15; y < 7; y += 5.6) g.fillRect(-W - 2, y, W * 2 + 4, 2.8);
    g.fillStyle = C.marine2; g.fillRect(-W - 2, 8, W * 2 + 4, 14);
    g.fillStyle = 'rgba(31,42,68,.0)';
    g.restore();
    path(); trace(g, lw);
    // Col marin carré dans le dos
    g.fillStyle = C.marine; g.beginPath(); g.moveTo(-1, -19); g.lineTo(-12.5, -16); g.lineTo(-12, -6); g.lineTo(-4.5, -9.5); g.closePath(); g.fill(); trace(g, lw);
    g.strokeStyle = C.creme; g.lineWidth = lw; g.beginPath(); g.moveTo(-10.4, -14.6); g.lineTo(-10, -8.4); g.stroke();
  }
  function teteMatelot(g, lw, P, seed) {
    g.fillStyle = C.marine2; g.beginPath(); g.moveTo(-10, -2); g.lineTo(-12, 5); g.lineTo(-7, 3); g.closePath(); g.fill(); trace(g, lw * 0.8);
    g.fillStyle = C.creme; g.beginPath(); g.ellipse(12.2, 3, 6.6, 2.8, 0.38, 0, TAU); g.fill(); trace(g, lw); // long nez
    g.beginPath(); g.ellipse(0, 0, 10.4, 11.4, 0, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = C.marine; g.strokeStyle = C.marine; g.lineWidth = lw; g.lineCap = 'round';
    g.beginPath(); g.arc(4.8, -1.4, P.bouche === 'o' ? 1.6 : 1.2, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(2.6, -4.4); g.lineTo(7, -4.8); g.stroke();
    bouche(g, lw, P, 6.4, 7.4, 0.8);
    // Bonnet plat, un peu penché selon le matelot
    g.save(); g.rotate(-0.08 + Math.sin(seed * 2.3) * 0.08);
    g.fillStyle = C.marine; rr(g, -11, -11.5, 21.5, 5.6, 1.6); g.fill(); trace(g, lw);
    g.fillStyle = C.creme; g.fillRect(-10.6, -8.6, 20.6, 1.2);
    g.fillStyle = C.marine; g.beginPath(); g.ellipse(-0.6, -12, 13.4, 3.6, 0, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = C.marine2; g.beginPath(); g.ellipse(-1.4, -12.8, 9, 1.6, 0, 0, TAU); g.fill();
    g.restore();
  }

  // ---------- Objets sur lesquels on tape (repère : milieu du dessus en (0, 0), sol en y = sol) ----------
  function eclat(g, lw, coup, r0, couleur) {
    if (coup <= 0.02) return;
    g.strokeStyle = couleur || C.moutarde; g.lineWidth = lw * 1.4; g.lineCap = 'round'; g.globalAlpha = Math.min(1, coup * 2);
    const r = r0 + (1 - coup) * 8; g.beginPath();
    for (const a of [-2.75, -2.25, -1.57, -0.9, -0.4]) { g.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.8 - 3); g.lineTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6) * 0.8 - 3); }
    g.stroke(); g.globalAlpha = 1;
  }
  function coque(g, lw, coup, sol) {
    // Bloc de coque riveté posé sur le pont
    rr(g, -12, 0, 24, sol, 2); g.fillStyle = C.brique; g.fill(); trace(g, lw);
    g.fillStyle = sombre(C.brique); g.fillRect(-12 + lw / 2, sol * 0.55, 24 - lw, sol * 0.45 - lw / 2);
    g.strokeStyle = C.marine; g.lineWidth = lw; g.beginPath(); g.moveTo(-12, sol * 0.55); g.lineTo(12, sol * 0.55); g.stroke();
    g.fillStyle = coup > 0.35 ? C.moutarde : C.sable;
    for (const x of [-8, -2.7, 2.7, 8]) for (const y of [3, sol * 0.55 + 3]) { g.beginPath(); g.arc(x, y, 1.3, 0, TAU); g.fill(); }
    eclat(g, lw, coup, 12);
  }
  function marmite(g, lw, coup, sol) {
    // Grosse marmite sur trois pieds, vapeur qui monte au coup
    const H = Math.min(sol - 5, 24);
    g.fillStyle = C.marine; for (const x of [-10, 9]) { rr(g, x, H - 1, 2.6, sol - H + 1, 1); g.fill(); }
    g.fillStyle = C.moutarde; g.beginPath(); g.moveTo(-15, 1); g.lineTo(15, 1); g.quadraticCurveTo(16, H, 0, H + 1); g.quadraticCurveTo(-16, H, -15, 1); g.closePath(); g.fill(); trace(g, lw);
    g.fillStyle = D.moutarde; g.fillRect(-14.5, 6, 29, 2.6);
    for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 17, 6, 2.6, 0, TAU); g.strokeStyle = C.marine; g.lineWidth = lw * 2.2; g.stroke(); g.strokeStyle = C.moutarde; g.lineWidth = lw; g.stroke(); }
    rr(g, -16.5, -1.2, 33, 3.4, 1.4); g.fillStyle = D.moutarde; g.fill(); trace(g, lw);
    g.fillStyle = C.creme; g.globalAlpha = 0.9;
    for (let i = 0; i < 3; i++) { const k = frac(coup * 0.5 + i / 3); g.beginPath(); g.arc(-6 + i * 6 + Math.sin(k * 6) * 2, -4 - (1 - coup) * 8 - i * 3, 2.4 + coup * 1.6, 0, TAU); g.fill(); trace(g, lw * 0.6); }
    g.globalAlpha = 1;
    eclat(g, lw, coup, 15);
  }
  function tuyau(g, lw, coup, sol) {
    // Tuyau horizontal avec brides, soutenu par une colonne ; jet de vapeur au coup
    g.fillStyle = C.marine2; rr(g, -4, 4, 8, sol - 4, 1.4); g.fill(); trace(g, lw);
    rr(g, -20, 0, 40, 8, 4); g.fillStyle = C.vert; g.fill(); trace(g, lw);
    g.fillStyle = sombre(C.vert); g.fillRect(-19, 5, 38, 2.4);
    for (const x of [-13, 9]) { rr(g, x, -1.6, 4.2, 11.2, 1.2); g.fillStyle = C.moutarde; g.fill(); trace(g, lw * 0.8); }
    if (coup > 0.05) {
      g.fillStyle = C.creme; g.globalAlpha = Math.min(1, coup * 1.6);
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-19 - (1 - coup) * 6 - i * 4, 3 - i * 2.4, 2 + i * 0.9, 0, TAU); g.fill(); trace(g, lw * 0.6); }
      g.globalAlpha = 1;
    }
    eclat(g, lw, coup, 12);
  }
  function rambarde(g, lw, coup, sol) {
    // Rambarde en bois sur poteaux de fer
    g.fillStyle = C.marine2; for (const x of [-11, 9]) { rr(g, x, 2, 2.8, sol - 2, 1); g.fill(); trace(g, lw * 0.8); }
    g.strokeStyle = C.marine; g.lineWidth = lw * 1.4; g.beginPath(); g.moveTo(-14, sol * 0.55); g.lineTo(14, sol * 0.55); g.stroke();
    rr(g, -16, -0.5, 32, 4.4, 2); g.fillStyle = C.sable; g.fill(); trace(g, lw);
    g.strokeStyle = sombre(C.sable); g.lineWidth = lw * 0.8; g.beginPath(); g.moveTo(-13, 2); g.lineTo(-4, 2); g.moveTo(1, 2.6); g.lineTo(12, 2.6); g.stroke();
    eclat(g, lw, coup, 12);
  }
  const OBJETS = { tambour: (g, lw, c) => tambour(g, lw, c), coque, marmite, tuyau, rambarde };

  // Outils tenus en main (repère de la main, l'outil part vers +x)
  function outilLouche(g, lw) {
    g.lineCap = 'round';
    g.strokeStyle = C.marine; g.lineWidth = 3 + lw * 2; g.beginPath(); g.moveTo(-2, 0); g.lineTo(16, 0); g.stroke();
    g.strokeStyle = C.sable; g.lineWidth = 3; g.stroke();
    g.fillStyle = C.moutarde; g.beginPath(); g.ellipse(19.5, 1.2, 4.6, 3.6, 0.2, 0, TAU); g.fill(); trace(g, lw);
    g.fillStyle = D.moutarde; g.beginPath(); g.ellipse(19.2, 0.2, 3, 1.4, 0.2, 0, TAU); g.fill();
  }
  function outilCle(g, lw) {
    g.save(); g.rotate(Math.PI / 2); g.scale(0.52, 0.52); g.translate(0, -15); cleSeule(g, lw / 0.52); g.restore();
  }

  // ---------- Fiches des personnages ----------
  // L : positions de repos (unités = % de la hauteur), objet = milieu du dessus de l'objet frappé
  const PERSOS = {
    pepin: {
      L: { corps: [0, -36], tete: [4, -74], main: [[-31, -33], [31, -33]], pied: [[-9, 0], [7, 0]], objet: [38, -32], panX: [-25, 20], panY: -103, pas: 12, ombre: 21 },
      frappe: 'doigts', pied: (g, lw, f) => chaussure(g, lw, f, { col: C.moutarde, sole: C.marine, revers: D.moutarde, haut: 14 }),
      main: { col: C.vert, poignet: C.creme }, corps: (g, lw) => { bouee(g, lw, false); corpsPepin(g, lw); bouee(g, lw, true); }, tete: tetePepin, flop: true,
    },
    hortense: {
      L: { corps: [0, -45], tete: [5, -82], main: [[-24, -43], [24, -43]], pied: [[-7, 0], [6, 0]], objet: [36, -40], panX: [-22, 21], panY: -104, pas: 14, ombre: 18 },
      frappe: 'plat', pied: (g, lw, f) => chaussure(g, lw, f, { col: C.marine2, sole: C.marine, revers: C.marine, haut: 18 }),
      main: { col: C.marine2, poignet: C.brique, doigts: true }, corps: corpsHortense, tete: teteHortense,
    },
    gaston: {
      L: { corps: [0, -40], tete: [5, -76], main: [[-23, -38], [23, -38]], pied: [[-7, 0], [6, 0]], objet: [34, -34], panX: [-24, 20], panY: -102, pas: 13, ombre: 18 },
      frappe: 'plat', pied: (g, lw, f) => chaussure(g, lw, f, { col: C.marine2, sole: C.marine, revers: C.marine, haut: 13, lacets: C.sable }),
      main: { col: C.brique, poignet: C.sable, doigts: true }, corps: corpsGaston, arriere: (g, lw, P) => { if (P.outil !== 'cle') cleGaston(g, lw); }, tete: teteGaston,
      outils: { tuyau: 'cle' },
    },
    bouillon: {
      L: { corps: [0, -36], tete: [4, -66], main: [[-31, -34], [31, -34]], pied: [[-9, 0], [8, 0]], objet: [44, -30], panX: [-30, 25], panY: -93, pas: 11, ombre: 24 },
      frappe: 'plat', pied: (g, lw, f) => chaussure(g, lw, f, { col: C.brique, sole: C.marine, revers: null, haut: 10 }),
      main: { col: C.creme, poignet: C.marine2, doigts: true }, corps: corpsBouillon, devant: (g, lw, P) => { if (P.outil !== 'louche') loucheBouillon(g, lw); }, tete: teteBouillon,
      outils: { marmite: 'louche' },
    },
    matelot: {
      L: { corps: [0, -42], tete: [5, -77], main: [[-24, -40], [24, -40]], pied: [[-8, 0], [6, 0]], objet: [34, -36], panX: [-24, 20], panY: -103, pas: 13, ombre: 18 },
      frappe: 'plat', pied: (g, lw, f) => chaussure(g, lw, f, { col: C.marine, sole: C.marine2, revers: C.marine2, haut: 12 }),
      main: { col: C.creme, poignet: C.marine, doigts: true }, corps: corpsMatelot, tete: teteMatelot,
    },
  };
  const OUTILS = { louche: outilLouche, cle: outilCle };

  // ---------- Poses (fonction pure du temps) ----------
  function pose(D, etat, t, seed) {
    const L = D.L, s = seed || 0, [cx, cy] = L.corps, [tx, ty] = L.tete, [[ax, ay], [bx, by]] = L.main;
    const P = {
      corps: [cx, cy, 0, 1, 1], tete: [tx, ty, 0],
      main: [[ax, ay, 0.15], [bx, by, -0.15]], pied: [[L.pied[0][0], 0, 0], [L.pied[1][0], 0, 0]],
      flop: 0, bouche: 'calme', gouttes: false, objet: null, coup: -1, ecrase: [0, 0], balance: 0, outil: null,
    };
    if (etat === 'course' || etat === 'panique') {
      const pan = etat === 'panique', ph = (t + s * 0.31) * TAU * (pan ? 2.3 : 1.7), pas = L.pas + (pan ? 1 : 0), k = L.pas / 12;
      for (let i = 0; i < 2; i++) {
        const p = ph + i * Math.PI, up = Math.max(0, Math.sin(p));
        // Le pied avance en l'air (sin > 0) et recule au sol : x = -cos
        P.pied[i] = [L.pied[i][0] + (i ? -3 : 6) - Math.cos(p) * pas, -up * (pan ? 10 : 8) * k, -0.3 * up];
      }
      const rebond = Math.abs(Math.sin(ph));
      P.corps = [cx + 2, cy - 1 - rebond * 3, pan ? 0.03 * Math.sin(t * 31) : 0.11, 1 + rebond * 0.02, 1 - rebond * 0.03 + 0.03];
      P.tete = [pan ? tx - 1 + Math.sin(t * 37) * 0.9 : tx + 4, (pan ? ty + 6 : ty - 1) - Math.abs(Math.sin(ph - 0.5)) * 3.2, pan ? -0.08 : 0.1];
      if (pan) {
        // Mains au-dessus de la tête, qui s'agitent vite et en décalé
        for (let i = 0; i < 2; i++) { const a = t * 21 + i * 2.1 + s; P.main[i] = [tx + L.panX[i] + Math.sin(a) * 4, L.panY + Math.cos(a * 1.3) * 3.5 + (i ? 1.5 : 0), Math.PI + Math.sin(a) * 0.55]; }
        P.flop = 0.25 + Math.sin(t * 15) * 0.35; P.bouche = 'o'; P.gouttes = true; P.balance = Math.sin(t * 17) * 0.6;
      } else {
        // Chaque main balance à l'opposé du pied du même côté
        for (let i = 0; i < 2; i++) { const p = ph + i * Math.PI, av = Math.cos(p); P.main[i] = [(i ? bx - 3 : ax + 6) + av * 10, ay - 1 - Math.max(0, av) * 4, -av * 0.5]; }
        P.flop = 0.22 + Math.abs(Math.sin(ph - 0.9)) * 0.18; P.bouche = 'souffle'; P.balance = Math.sin(ph) * 0.35;
      }
      P.ombre = 1 - rebond * 0.08;
    } else if (etat.indexOf('tambour') === 0) {
      // Frappe pile sur le temps (t multiple de 60/102 s)
      const objet = etat.split('-')[1] || 'tambour', [ox, oy] = L.objet;
      const beat = t / BEAT, k = frac(beat), sq = Math.exp(-k * 9), nod = Math.exp(-Math.max(0, k - 0.05) * 7);
      P.objet = objet; P.coup = sq;
      P.corps = [cx, cy + sq * 1.6, 0.07 + sq * 0.05, 1 + sq * 0.05, 1 - sq * 0.07];
      P.tete = [tx + 1 + sq * 1.2, ty + nod * 3, 0.06 + nod * 0.1];
      const outil = D.outils && D.outils[objet];
      if (outil) {
        // Outil dans la main de devant : il frappe à chaque temps ; la main du fond reste près du corps
        const L1 = k < 0.18 ? easeOut(k / 0.18) : k < 0.84 ? 1 + 0.15 * (k - 0.18) / 0.66 : 1.15 * (1 - easeIn((k - 0.84) / 0.16));
        P.outil = outil;
        P.main[1] = [ox - 11 - L1 * 2, oy - 13 - L1 * 4, 0.95 - L1 * 1.25];
        P.main[0] = [ax + 4, ay + 2 + Math.sin(beat * Math.PI) * 1.2, 0.2];
      } else {
        const plat = D.frappe === 'plat', haut = plat ? 5.5 : 6.5;
        for (let j = 0; j < 2; j++) {
          const q = frac((beat - j) / 2);
          const Lh = q < 0.18 ? 19 * easeOut(q / 0.18) : q < 0.84 ? 19 + 3 * (q - 0.18) / 0.66 : 22 * (1 - easeIn((q - 0.84) / 0.16));
          P.main[j] = plat ? [ox + (j ? 7 : -9), oy - haut - Lh, -Math.PI / 2 + 0.1 - Lh * 0.018] : [(j ? ox + 6 : ox - 5) - Lh * 0.12, oy - haut - Lh, -0.35 + Lh * 0.012];
          P.ecrase[j] = q < 0.06 ? 1 - q / 0.06 : 0;
        }
        P.plat = plat;
      }
      P.pied[1] = [L.pied[1][0], 0, -0.3 * Math.sin(Math.PI * Math.min(1, k * 1.4))];
      P.flop = 0.05 + nod * 0.3; P.bouche = k < 0.25 ? 'o' : 'rire'; P.balance = sq * 0.5;
    } else {
      const tt = t + s * 0.37, br = Math.sin(tt * 2.2);
      P.corps = [cx, cy - br * 0.6, 0, 1 - br * 0.008, 1 + br * 0.018];
      P.tete = [tx, ty - Math.sin(tt * 2.2 - 0.6) * 1, Math.sin(tt * 0.9) * 0.035];
      const hb = Math.sin(tt * 2.2 - 0.9) * 1.2;
      P.main = [[ax, ay - hb, 0.15 + br * 0.04], [bx, by - hb, -0.15 - br * 0.04]];
      P.flop = Math.sin(tt * 1.1) * 0.07; P.balance = Math.sin(tt * 1.3) * 0.1;
    }
    return P;
  }

  // ---------- Dessin ----------
  function dessine(g, D, h, etat, t, seed) {
    const P = pose(D, etat, t, seed), lw = Math.max(0.7, 110 / h);
    const at = (p, fn) => { g.save(); g.translate(p[0], p[1]); g.rotate(p[2] || 0); if (p[3]) g.scale(p[3], p[4]); fn(); g.restore(); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = 'rgba(31,42,68,.16)'; g.beginPath(); g.ellipse(2, 0.5, D.L.ombre * P.ombre, 2.6, 0, 0, TAU); g.fill();
    if (P.objet === 'tambour') at([D.L.objet[0], D.L.objet[1] + P.coup * 1.4], () => OBJETS.tambour(g, lw, P.coup));
    at(P.pied[0], () => D.pied(g, lw, true));
    at(P.main[0], () => main(g, lw, true, D.main, P.ecrase[0], P.plat));
    at(P.corps, () => { if (D.arriere) D.arriere(g, lw, P); D.corps(g, lw, P); if (D.devant) D.devant(g, lw, P); });
    at(P.tete, () => D.tete(g, lw, P, seed));
    if (P.gouttes) for (let i = 0; i < 2; i++) {
      const q = frac(t * 1.7 + i * 0.5); g.globalAlpha = q < 0.7 ? 1 : (1 - q) / 0.3;
      at([P.tete[0] + (i ? 1 : -1) * (19 + q * 13), P.tete[1] - 4 - Math.sin(q * Math.PI) * 6 + q * 12, (i ? 0.5 : -0.5) + q * (i ? 0.5 : -0.5)], () => goutte(g, lw, q));
      g.globalAlpha = 1;
    }
    at(P.pied[1], () => D.pied(g, lw, false));
    if (P.objet && P.objet !== 'tambour') { const f = OBJETS[P.objet] || OBJETS.tambour; at([D.L.objet[0], D.L.objet[1] + P.coup * 0.8], () => f(g, lw, P.coup, -D.L.objet[1] - P.coup * 0.8)); }
    at(P.main[1], () => { if (P.outil) OUTILS[P.outil](g, lw); main(g, lw, false, D.main, P.ecrase[1], P.plat); });
  }

  function draw(g, nom, x, y, h, etat, t, dir, seed) {
    g.save();
    g.translate(x, y); g.scale((dir || 1) * h / 100, h / 100);
    dessine(g, PERSOS[nom] || PERSOS.pepin, h, etat || 'repos', t, seed || 0);
    g.restore();
  }
  return {
    draw, BEAT, noms: Object.keys(PERSOS),
    etats: ['repos', 'course', 'panique', 'tambour', 'tambour-coque', 'tambour-marmite', 'tambour-tuyau', 'tambour-rambarde'],
    // Objet conseillé pour chaque personnage à son poste
    poste: { pepin: 'tambour-coque', hortense: 'tambour-rambarde', gaston: 'tambour-tuyau', bouillon: 'tambour-marmite', matelot: 'tambour-coque' },
  };
})();
