// Souquez ! : images de la DA (Gemini). Le jeu marche sans elles : chaque élément sans image garde sa forme simple.
// Ce qui est présent est listé dans assets/manifest.json (évite des erreurs 404 dans la console).
//   navire : { "img": "navire/grondeuse_coupe.png", "largeur": 330, "x": 0, "y": 0 }   (largeur en unités du monde, 400 = hauteur d'écran)
//   fond : { "img": "fonds/mer1_fond.png" }                                                (pas de détourage)
//   monstres : { "sardine": { "img": "monstres/sardine.png", "hauteur": 120, "regard": "gauche" }, ... }
//   equipage : [ "equipage/pepin.json", ... ]  (un JSON par matelot, fait par l'outil de découpe)
// Matelot (JSON) : { "taille": 90, "morceaux": { "corps": { "img": "pepin_corps.png", "pivot": [x, y],
//   "points": { "cou": [x, y], "epaule": [x, y], "hanche": [x, y] } }, "tete": { "img", "pivot" },
//   "bras": { ..., "points": { "coude": [x, y] } }, "avantbras": { ..., "points": { "main": [x, y] } },
//   "jambe": { ..., "points": { "genou": [x, y] } }, "mollet": {...}, "accessoire": {...} } }
//   Coordonnées en pixels de l'image du morceau ; taille = hauteur à l'écran de référence 1280×720.
'use strict';
const ART = { ready: false, navire: null, fond: null, monstres: {}, equipage: [] };
const PX_TO_UNIT = 400 / 720; // écran de référence : 720 px de haut = 400 unités

// Détourage du magenta avec tolérance et bords adoucis (Gemini ne rend jamais un #FF00FF exact)
function keyMagenta(img) {
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  try {
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, LO = 50, HI = 110;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], gr = p[i + 1], b = p[i + 2], m = Math.min(r, b) - gr; // « magentitude »
      if (m <= LO || Math.abs(r - b) > 110) continue;
      const a = m >= HI ? 0 : 1 - (m - LO) / (HI - LO);
      p[i + 3] = Math.round(p[i + 3] * a);
      const s = 1 - a; p[i] = r - (r - gr) * s; p[i + 2] = b - (b - gr) * s; // retire le reflet magenta des bords
    }
    g.putImageData(d, 0, 0);
  } catch (_) {}
  return c;
}
// Copie plus sombre (bras et jambe du fond)
function darker(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,24,40,.35)'; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function loadImg(src, key) {
  return new Promise((ok) => {
    const i = new Image();
    i.onload = () => ok(key ? keyMagenta(i) : i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}
const assetUrl = (p) => 'assets/' + p;
async function loadPuppet(path) {
  try {
    const r = await fetch(assetUrl(path)); if (!r.ok) return null;
    const j = await r.json(), dir = path.replace(/[^/]*$/, ''), parts = {};
    for (const [name, m] of Object.entries(j.morceaux || {})) {
      const img = await loadImg(assetUrl(dir + m.img), true); if (!img) continue;
      parts[name] = { img, dark: darker(img), pivot: m.pivot || [img.width / 2, 0], points: m.points || {} };
    }
    if (!parts.corps) return null;
    const P = { name: j.nom || path, taille: j.taille || 90, parts };
    P.scale = puppetScale(P);
    return P;
  } catch (_) { return null; }
}
async function loadArt() {
  let man;
  try { const r = await fetch('assets/manifest.json', { cache: 'no-cache' }); if (!r.ok) return; man = await r.json(); } catch (_) { return; }
  if (man.navire && man.navire.img) { const img = await loadImg(assetUrl(man.navire.img), true); if (img) ART.navire = { ...man.navire, img }; }
  if (man.fond && man.fond.img) { const img = await loadImg(assetUrl(man.fond.img), false); if (img) ART.fond = { ...man.fond, img }; }
  for (const [type, m] of Object.entries(man.monstres || {})) {
    const img = m && m.img && await loadImg(assetUrl(m.img), true); if (img) ART.monstres[type] = { ...m, img };
  }
  for (const p of man.equipage || []) { const P = await loadPuppet(p); if (P) ART.equipage.push(P); }
  ART.ready = true;
}
loadArt();

// ---------- Pantins (matelots en morceaux) ----------
// Squelette fixe : morceau → [parent, point d'attache sur le parent]
const BONES = { tete: ['corps', 'cou'], bras: ['corps', 'epaule'], avantbras: ['bras', 'coude'], accessoire: ['avantbras', 'main'], jambe: ['corps', 'hanche'], mollet: ['jambe', 'genou'] };
// Point d'attache par défaut si le JSON n'en donne pas : déduit de la forme du morceau
function attach(P, parent, point) {
  const q = P.parts[parent]; if (!q) return [0, 0];
  if (q.points[point]) return q.points[point];
  const w = q.img.width, h = q.img.height;
  return { cou: [w * 0.5, h * 0.05], epaule: [w * 0.5, h * 0.18], hanche: [w * 0.5, h * 0.9], coude: [w * 0.5, h * 0.92], genou: [w * 0.5, h * 0.92], main: [w * 0.5, h * 0.9] }[point] || [w / 2, h / 2];
}
// Hauteur du pantin assemblé au repos (en pixels source), pour l'échelle
function puppetScale(P) {
  let top = 0, bottom = 0;
  const walk = (name, ox, oy) => {
    const q = P.parts[name]; if (!q) return;
    top = Math.min(top, oy - q.pivot[1]); bottom = Math.max(bottom, oy + q.img.height - q.pivot[1]);
    for (const [child, [par, pt]] of Object.entries(BONES)) if (par === name) { const a = attach(P, name, pt); walk(child, ox + a[0] - q.pivot[0], oy + a[1] - q.pivot[1]); }
  };
  walk('corps', 0, 0);
  P.feet = bottom; // distance bassin → pieds
  return (P.taille * PX_TO_UNIT) / Math.max(1, bottom - top);
}
// Pose : angles en radians par morceau (0 = pose de repos de la planche)
function pose(state, t, seed) {
  const s = Math.sin(t * 14 + seed), c = Math.cos(t * 14 + seed), b = Math.sin(t * 2.2 + seed) * 0.03;
  if (state === 'run') return { corps: 0.12, tete: -0.08, bras: s * 0.9, avantbras: -0.6, jambe: s * 0.7, mollet: 0.5 + c * 0.4, bras2: -s * 0.9, avantbras2: -0.6, jambe2: -s * 0.7, mollet2: 0.5 - c * 0.4 };
  if (state === 'alarm') return { corps: 0, tete: -0.15, bras: -2.6, avantbras: -0.3, jambe: 0, mollet: 0, bras2: -2.4, avantbras2: -0.3, jambe2: 0, mollet2: 0 };
  return { corps: b, tete: b * 2, bras: 0.08 + b, avantbras: -0.15, jambe: 0, mollet: 0, bras2: -0.05, avantbras2: -0.1, jambe2: 0.05, mollet2: 0 };
}
// Dessine un pantin, pieds en (x, y), regard à droite (dir = -1 : à gauche)
function drawPuppet(P, x, y, state, bob, dir, seed) {
  const A = pose(state, tAmb, seed || 0), k = P.scale;
  cx.save(); cx.translate(x, y - bob * 5); cx.scale(k * (dir || 1), k); cx.translate(0, -P.feet);
  const part = (name, ang, dark, then) => {
    const q = P.parts[name]; if (!q) return;
    cx.save(); cx.rotate(ang || 0); cx.drawImage(dark ? q.dark : q.img, -q.pivot[0], -q.pivot[1]);
    if (then) then(q); cx.restore();
  };
  const at = (parent, pt, q) => { const a = attach(P, parent, pt); cx.translate(a[0] - q.pivot[0], a[1] - q.pivot[1]); };
  const limb = (up, low, end, pt, a1, a2, dark) => (q) => { cx.save(); at('corps', pt, q); part(up, a1, dark, (u) => { at(up, up === 'bras' ? 'coude' : 'genou', u); part(low, a2, dark, end ? (l) => { at(low, 'main', l); part('accessoire', 0, dark); } : null); }); cx.restore(); };
  // Corps : membres du fond (plus sombres), corps, tête, membres de devant
  cx.rotate(A.corps);
  const body = P.parts.corps;
  limb('bras', 'avantbras', false, 'epaule', A.bras2, A.avantbras2, true)(body);
  limb('jambe', 'mollet', false, 'hanche', A.jambe2, A.mollet2, true)(body);
  part('corps', 0, false);
  cx.save(); at('corps', 'cou', body); part('tete', A.tete, false); cx.restore();
  limb('jambe', 'mollet', false, 'hanche', A.jambe, A.mollet, false)(body);
  limb('bras', 'avantbras', true, 'epaule', A.bras, A.avantbras, false)(body);
  cx.restore();
}
