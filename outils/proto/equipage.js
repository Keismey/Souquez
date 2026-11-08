// Souquez ! : équipage dessiné en canvas (membres flottants). Modèle de départ pour la DA.
// Contrat : /mnt/project-files/souquez/prog/contrat-equipage-canvas.md
'use strict';
const EQUIPAGE = (() => {
  const C = { marine: '#1F2A44', brique: '#B5452F', creme: '#F2E6CC', moutarde: '#E0A82E', vert: '#7FA89A', marine2: '#3C4D6B', sable: '#D9C9A6' };
  const BEAT = 60 / 102;
  // Position des membres selon l'état, en fractions de la hauteur (u = h). Origine : entre les pieds, y vers le haut négatif.
  function pose(etat, t, seed) {
    const s = Math.sin(t * 2.4 + seed);
    const P = { corps: [0, -0.45 + s * 0.005], tete: [0.02, -0.8], mainAv: [0.12, -0.42], mainAr: [-0.1, -0.44], piedAv: [0.08, 0], piedAr: [-0.07, 0], rot: 0 };
    if (etat === 'course') { const r = t * 11 + seed; P.piedAv = [Math.sin(r) * 0.15, -Math.max(0, Math.cos(r)) * 0.08]; P.piedAr = [-Math.sin(r) * 0.15, -Math.max(0, -Math.cos(r)) * 0.08]; P.mainAv[0] -= Math.sin(r) * 0.1; P.mainAr[0] += Math.sin(r) * 0.1; P.rot = 0.12; }
    if (etat === 'panique') { const w = Math.sin(t * 19 + seed); P.mainAv = [0.14, -0.95 + w * 0.04]; P.mainAr = [-0.12, -0.98 - w * 0.04]; }
    if (etat === 'tambour') { const f = (t / BEAT) % 1, up = f < 0.1 ? 0 : Math.sin(Math.min(1, (f - 0.1) / 0.9) * Math.PI); P.mainAv = [0.2, -0.45 - up * 0.2]; }
    return P;
  }
  const PERSOS = {
    // Chaque personnage dessine ses morceaux autour de (0, 0) ; u = unité (hauteur du personnage)
    pepin: {
      corps(g, u) { g.fillStyle = C.marine; g.beginPath(); g.ellipse(0, 0, u * 0.14, u * 0.2, 0, 0, 7); g.fill(); },
      tete(g, u) { g.fillStyle = C.creme; g.beginPath(); g.arc(0, 0, u * 0.13, 0, 7); g.fill(); g.fillStyle = C.marine; g.beginPath(); g.arc(0, -u * 0.03, u * 0.14, Math.PI, 0); g.fill(); },
      main(g, u, fond) { g.fillStyle = fond ? '#6a8c80' : C.vert; g.beginPath(); g.arc(0, 0, u * 0.05, 0, 7); g.fill(); },
      pied(g, u, fond) { g.fillStyle = fond ? '#b88a26' : C.moutarde; g.beginPath(); g.ellipse(u * 0.03, -u * 0.04, u * 0.07, u * 0.04, 0, 0, 7); g.fill(); },
    },
  };
  function draw(g, nom, x, y, h, etat, t, dir, seed) {
    const D = PERSOS[nom] || PERSOS.pepin, P = pose(etat, t, seed || 0), at = (p, fn) => { g.save(); g.translate(p[0] * h, p[1] * h); fn(); g.restore(); };
    g.save(); g.translate(x, y); g.scale(dir || 1, 1); g.rotate(P.rot * 0.3);
    at(P.piedAr, () => D.pied(g, h, true)); at(P.mainAr, () => D.main(g, h, true));
    at(P.corps, () => D.corps(g, h)); at(P.tete, () => D.tete(g, h));
    at(P.piedAv, () => D.pied(g, h, false)); at(P.mainAv, () => D.main(g, h, false));
    g.restore();
  }
  return { draw, BEAT };
})();
