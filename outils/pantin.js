// Souquez ! : moteur de pantin des outils (découpe, prototype d'animation).
// Il sera repris dans le jeu (js/images.js) une fois le prototype validé par le directeur.
// Un pantin : { taille, parts: { corps, tete, bras, avantbras, jambe, mollet, accessoire } },
// chaque morceau : { img (canvas détouré), pivot: [x, y], points: { cou, epaule, hanche, coude, main, genou } }.
'use strict';
const PANTIN = (() => {
  // Squelette : morceau → [parent, point d'attache sur le parent]
  const BONES = { tete: ['corps', 'cou'], bras: ['corps', 'epaule'], avantbras: ['bras', 'coude'], accessoire: ['avantbras', 'main'], jambe: ['corps', 'hanche'], mollet: ['jambe', 'genou'] };
  function attach(P, parent, point) {
    const q = P.parts[parent]; if (!q) return [0, 0];
    if (q.points && q.points[point]) return q.points[point];
    const w = q.img.width, h = q.img.height;
    return ({ cou: [w * 0.5, h * 0.05], epaule: [w * 0.5, h * 0.18], hanche: [w * 0.5, h * 0.9], coude: [w * 0.5, h * 0.92], genou: [w * 0.5, h * 0.92], main: [w * 0.5, h * 0.9] })[point] || [w / 2, h / 2];
  }
  function darker(src) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,24,40,.35)'; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  // Prépare un pantin : copies sombres (membres du fond) et mesure au repos (bassin → pieds, hauteur totale)
  function prepare(P) {
    for (const q of Object.values(P.parts)) q.dark = darker(q.img);
    let top = 0, bottom = 0;
    const walk = (name, ox, oy) => {
      const q = P.parts[name]; if (!q) return;
      top = Math.min(top, oy - q.pivot[1]); bottom = Math.max(bottom, oy + q.img.height - q.pivot[1]);
      for (const [child, [par, pt]] of Object.entries(BONES)) if (par === name) { const a = attach(P, name, pt); walk(child, ox + a[0] - q.pivot[0], oy + a[1] - q.pivot[1]); }
    };
    walk('corps', 0, 0);
    P.feet = bottom; P.height = Math.max(1, bottom - top);
    return P;
  }
  const BEAT = 60 / 102; // tempo du jeu
  // Poses : angles en radians (0 = position de la planche, membre pendant). Positif = sens horaire.
  // y : décalage vertical du corps (en fraction de la hauteur), pour les rebonds.
  function pose(state, t, seed) {
    seed = seed || 0;
    if (state === 'course') {
      const ph = t * 11 + seed, s = Math.sin(ph), c = Math.cos(ph);
      return { y: 0, corps: 0.14, tete: -0.1 + s * 0.03,
        jambe: -s * 0.6, mollet: 0.2 + Math.max(0, c) * 0.9, jambe2: s * 0.6, mollet2: 0.2 + Math.max(0, -c) * 0.9,
        bras: s * 0.85, avantbras: -1.1, bras2: -s * 0.85, avantbras2: -1.1 };
    }
    if (state === 'panique') {
      const w = Math.sin(t * 19 + seed), w2 = Math.sin(t * 19 + seed + 1.7), hop = Math.abs(Math.sin(t * 9.5 + seed));
      return { y: -hop * 0.05, corps: -0.06 + w * 0.03, tete: -0.12 + Math.sin(t * 23) * 0.12,
        bras: -2.4 + w * 0.35, avantbras: -0.35 + w2 * 0.4, bras2: -3.0 - w2 * 0.3, avantbras2: -0.3 - w * 0.35,
        jambe: -0.12 + hop * 0.1, mollet: 0.2 * hop, jambe2: 0.12 - hop * 0.1, mollet2: 0.2 * hop };
    }
    if (state === 'tambour') {
      // Une main par temps, en alternance : la baguette (la moufle) tombe pile sur le temps, puis remonte lentement
      const b = t / BEAT, f = b - Math.floor(b);
      const lift = (u) => u < 0.08 ? 0 : u < 0.7 ? 1 - (1 - (u - 0.08) / 0.62) ** 2 : 1 - ((u - 0.7) / 0.3) ** 2;
      const hand = (off) => { const u = (((b - off) % 2) + 2) % 2 / 2, l = lift(u); return [-1.05 - l * 0.95, -0.3 - l * 1.0]; };
      const [b1, a1] = hand(0), [b2, a2] = hand(1), dip = Math.exp(-f * 9) * 0.02;
      return { y: 0, drum: f, corps: 0.08 + dip * 2, tete: 0.1 + dip * 4,
        bras: b1, avantbras: a1, bras2: b2 + 0.1, avantbras2: a2,
        jambe: -0.14, mollet: 0.14, jambe2: 0.16, mollet2: 0.05 };
    }
    // repos : respiration lente
    const br = Math.sin(t * 2.4 + seed);
    return { y: br * 0.006, corps: br * 0.015, tete: br * 0.04 + 0.02, bras: 0.06 + br * 0.03, avantbras: -0.18 - br * 0.04,
      bras2: -0.06 - br * 0.03, avantbras2: -0.12, jambe: -0.04, mollet: 0.02, jambe2: 0.06, mollet2: 0 };
  }
  // Squelette posé : appelle draw(nom, image, sombre) avec le contexte déjà placé.
  // Sert à dessiner, et aussi à mesurer (où sont les pieds, où est la main de devant).
  function rig(g, P, A, visit) {
    const part = (name, ang, dark, then) => {
      const q = P.parts[name]; if (!q) return;
      g.save(); g.rotate(ang || 0); g.translate(-q.pivot[0], -q.pivot[1]); visit(name, q, dark); g.translate(q.pivot[0], q.pivot[1]);
      if (then) then(q); g.restore();
    };
    const at = (parent, pt, q, dx) => { const a = attach(P, parent, pt); g.translate(a[0] - q.pivot[0] + (dx || 0), a[1] - q.pivot[1]); };
    const body = P.parts.corps, bw = body.img.width;
    const limb = (up, low, hand, pt, a1, a2, dark, dx) => { g.save(); at('corps', pt, body, dx); part(up, a1, dark, (u) => { at(up, up === 'bras' ? 'coude' : 'genou', u); part(low, a2, dark, hand ? (l) => { at(low, 'main', l); part('accessoire', 0, dark); } : null); }); g.restore(); };
    g.rotate(A.corps || 0);
    // Ordre : bras et jambe du fond (plus sombres), tête (le col du pull la recouvre), corps, jambe et bras de devant
    limb('bras', 'avantbras', true, 'epaule', A.bras2, A.avantbras2, true, -bw * 0.06);
    limb('jambe', 'mollet', false, 'hanche', A.jambe2, A.mollet2, true, -bw * 0.07);
    g.save(); at('corps', 'cou', body); part('tete', A.tete, false); g.restore();
    part('corps', 0, false);
    limb('jambe', 'mollet', false, 'hanche', A.jambe, A.mollet, false, bw * 0.03);
    limb('bras', 'avantbras', true, 'epaule', A.bras, A.avantbras, false, bw * 0.02);
  }
  // Mesure : point le plus bas des bottes et main de devant (repère du bassin, avant échelle)
  let probeCtx = null;
  function measurePose(P, A) {
    if (!probeCtx) probeCtx = document.createElement('canvas').getContext('2d');
    const g = probeCtx; g.setTransform(1, 0, 0, 1, 0, 0);
    let low = -1e9, hand = null;
    const pt = (x, y) => { const m = g.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
    rig(g, P, A, (name, q, dark) => {
      if (name === 'mollet') for (const x of [q.img.width * 0.15, q.img.width * 0.85]) low = Math.max(low, pt(x, q.img.height - 5)[1]);
      if (name === 'avantbras' && !dark) { const m = q.points.main || [q.img.width / 2, q.img.height * 0.9]; hand = pt(m[0], m[1]); }
    });
    return { low, hand };
  }
  // Dessine le pantin, pieds posés au sol en (x, y), hauteur h en pixels, regard à droite (dir = -1 : à gauche).
  // Les pieds restent au sol (le corps monte et descend avec les jambes) ; A.y ajoute un saut.
  // Renvoie la pose, avec la position à l'écran de la main de devant (A.hand).
  function draw(g, P, x, y, h, state, t, dir, seed) {
    const A = pose(state, t, seed), k = h / P.height, M = measurePose(P, A);
    g.save(); g.translate(x, y + (A.y || 0) * h); g.scale(k * (dir || 1), k); g.translate(0, -M.low);
    rig(g, P, A, (name, q, dark) => g.drawImage(dark ? q.dark : q.img, 0, 0));
    g.restore();
    if (M.hand) A.hand = [x + M.hand[0] * k * (dir || 1), y + (A.y || 0) * h + (M.hand[1] - M.low) * k];
    return A;
  }
  // Charge un pantin depuis son JSON (images déjà détourées par l'outil de découpe)
  async function load(url) {
    const r = await fetch(url, { cache: 'no-cache' }); const j = await r.json();
    const dir = url.replace(/[^/]*$/, ''), parts = {};
    for (const [name, m] of Object.entries(j.morceaux || {})) {
      const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = dir + m.img; });
      if (!img) continue;
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
      parts[name] = { img: c, pivot: m.pivot, points: m.points || {} };
    }
    return prepare({ nom: j.nom, taille: j.taille || 90, parts });
  }
  return { BONES, BEAT, attach, prepare, pose, draw, measurePose, load };
})();
