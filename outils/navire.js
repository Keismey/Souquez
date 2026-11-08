// Souquez ! : navire en images Gemini (coque en un calque + pièces mobiles), piloté par un fichier de données.
// Hors du jeu pour l'instant (banc : outils/banc-navire.html). Sera repris dans js/images.js après validation.
//
// Fichier de données (navire.json), coordonnées en pixels de l'image de la coque (image Gemini brute, marges magenta comprises) :
// {
//   "coque": { "img": "grondeuse_coupe.png", "largeur": 750 },           // largeur du navire à l'écran de référence 1280×720 (px) ; 750 = choix du directeur (ponts ~100 px)
//   "ponts": {                                                           // sol (y), plafond (haut) et étendue (x0, x1) de chaque zone
//     "pont":     { "sol": 300, "haut": 120, "x0": 300, "x1": 900, "postes": [420, 520, 620] },
//     "proue":    { ... }, "canons": { ... }, "machines": { ... }
//   },
//   "echelle": { "x": 640 },                                             // échelle entre les niveaux
//   "pieces": {                                                          // pièces mobiles, chacune sur fond magenta
//     "canon1": { "img": "canon.png", "pivot": [40, 30], "ancre": [1500, 520], "anim": "recul", "course": 14 },
//     "roue":   { "img": "roue.png", "pivot": [150, 150], "ancre": [700, 820], "anim": "rotation" },
//     "bielle": { "img": "bielle.png", "pivot": [20, 20], "ancre": [900, 760], "anim": "vaetvient", "axe": [1, 0], "course": 18 },
//     "trou":   { "img": "degat_trou.png", "pivot": [50, 50], "ancre": [1200, 700], "anim": "degat", "seuil": 0.75 }
//   }
// }
// pivot : point de la pièce (pixels de son image) posé sur l'ancre (pixels de l'image de la coque).
// anim : recul (canon, en arrière le long de x), rotation (roue), vaetvient (bielle, le long de axe),
//        degat (cache visible quand la coque est sous « seuil » de ses points de vie), fixe.
'use strict';
const NAVIRE = (() => {
  // Détourage du magenta (même réglage que le jeu) + recadrage sur la partie visible
  function keyed(img) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, LO = 50, HI = 110;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let i = 0, n = 0; i < p.length; i += 4, n++) {
      const r = p[i], gr = p[i + 1], b = p[i + 2], m = Math.min(r, b) - gr;
      if (m > LO && Math.abs(r - b) <= 110) {
        const a = m >= HI ? 0 : 1 - (m - LO) / (HI - LO);
        p[i + 3] = Math.round(p[i + 3] * a);
        const s = 1 - a; p[i] = r - (r - gr) * s; p[i + 2] = b - (b - gr) * s;
      }
      if (p[i + 3] > 8) { const x = n % c.width, y = (n / c.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    g.putImageData(d, 0, 0);
    if (x1 < 0) return { img: c, ox: 0, oy: 0 };
    const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1;
    t.getContext('2d').drawImage(c, -x0, -y0);
    return { img: t, ox: x0, oy: y0 }; // ox, oy : décalage du recadrage, pour garder les coordonnées de l'image brute
  }
  const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  async function load(url) {
    const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) return null;
    const j = await r.json(), dir = url.replace(/[^/]*$/, '');
    const raw = await loadImg(dir + j.coque.img); if (!raw) return null;
    const N = { data: j, coque: keyed(raw), brut: [raw.naturalWidth, raw.naturalHeight], pieces: {} };
    for (const [nom, m] of Object.entries(j.pieces || {})) {
      const im = await loadImg(dir + m.img); if (!im) continue;
      N.pieces[nom] = { ...m, ...keyed(im) };
    }
    // Échelle : la coque visible fait « largeur » px à 720 de haut
    N.k = (j.coque.largeur || 1000) / N.coque.img.width;
    return N;
  }

  // Dessine le navire : (x, y) = point de l'image brute (0, 0) une fois placé ; s = pixels écran par pixel de référence 720p.
  // etat : { t (s), recul: { canon1: 0..1, ... }, roue (rad), piston (rad), coque (0..1 des points de vie) }
  function draw(g, N, x, y, s, etat) {
    const k = N.k * s, e = etat || {};
    g.save(); g.translate(x, y); g.scale(k, k);
    g.drawImage(N.coque.img, N.coque.ox, N.coque.oy);
    for (const [nom, P] of Object.entries(N.pieces)) {
      let dx = 0, dy = 0, rot = 0;
      if (P.anim === 'recul') dx = -(P.course || 14) * ((e.recul && e.recul[nom]) || 0);
      else if (P.anim === 'rotation') rot = e.roue || 0;
      else if (P.anim === 'vaetvient') { const a = Math.sin(e.piston || 0) * (P.course || 18), ax = P.axe || [1, 0]; dx = ax[0] * a; dy = ax[1] * a; }
      else if (P.anim === 'degat' && !((e.coque ?? 1) < (P.seuil ?? 0.5))) continue;
      g.save(); g.translate(P.ancre[0] + dx, P.ancre[1] + dy); g.rotate(rot);
      g.drawImage(P.img, P.ox - P.pivot[0], P.oy - P.pivot[1]);
      g.restore();
    }
    g.restore();
  }
  // Passe d'un point de l'image brute à l'écran (pour placer l'équipage sur les ponts)
  const toScreen = (N, x, y, s, p) => [x + p[0] * N.k * s, y + p[1] * N.k * s];
  // Postes d'une zone, à l'écran : [[x, y_sol], ...] et hauteur sous plafond en px
  function postes(N, zone, x, y, s) {
    const Z = N.data.ponts[zone]; if (!Z) return { pts: [], haut: 0 };
    return { pts: (Z.postes || [(Z.x0 + Z.x1) / 2]).map((px) => toScreen(N, x, y, s, [px, Z.sol])), haut: (Z.sol - Z.haut) * N.k * s };
  }
  return { load, draw, toScreen, postes, keyed };
})();
