// Souquez ! : découpe automatique d'une planche de personnage Gemini (fond magenta).
// 1) détourage du magenta, 2) une région par morceau, 3) reconnaissance du rôle de chaque morceau
// (tête, corps, bras…) par sa forme et ses couleurs, 4) pivots proposés, 5) bras ou jambe entiers coupés au coude ou au genou.
// Tout est corrigeable ensuite dans decoupe.html (rôle, pivots, coupe).
'use strict';
const DECOUPE = (() => {
  // Palette de la charte (couleurs proches regroupées)
  const PAL = { marine: [31, 42, 68], brique: [181, 69, 47], creme: [242, 230, 204], moutarde: [224, 168, 46], vert: [127, 168, 154] };
  const PAL_K = Object.keys(PAL);
  const ROLES = ['tete', 'corps', 'bras', 'avantbras', 'jambe', 'mollet', 'accessoire'];

  // Détourage : même réglage que le jeu (js/images.js)
  function keyMagenta(img) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, LO = 50, HI = 110;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], gr = p[i + 1], b = p[i + 2], m = Math.min(r, b) - gr;
      if (m <= LO || Math.abs(r - b) > 110) continue;
      const a = m >= HI ? 0 : 1 - (m - LO) / (HI - LO);
      p[i + 3] = Math.round(p[i + 3] * a);
      const s = 1 - a; p[i] = r - (r - gr) * s; p[i + 2] = b - (b - gr) * s;
    }
    g.putImageData(d, 0, 0);
    return { canvas: c, data: d };
  }

  // Régions connexes (4-voisins) sur les pixels assez opaques
  function regions(d) {
    const W = d.width, H = d.height, p = d.data, lab = new Int32Array(W * H).fill(-1), out = [];
    const minArea = W * H * 0.0008;
    for (let s = 0; s < W * H; s++) {
      if (lab[s] !== -1 || p[s * 4 + 3] < 128) continue;
      const id = out.length, px = [], st = [s]; lab[s] = id;
      while (st.length) {
        const q = st.pop(); px.push(q);
        const x = q % W, y = (q / W) | 0;
        if (x > 0 && lab[q - 1] === -1 && p[(q - 1) * 4 + 3] >= 128) { lab[q - 1] = id; st.push(q - 1); }
        if (x < W - 1 && lab[q + 1] === -1 && p[(q + 1) * 4 + 3] >= 128) { lab[q + 1] = id; st.push(q + 1); }
        if (y > 0 && lab[q - W] === -1 && p[(q - W) * 4 + 3] >= 128) { lab[q - W] = id; st.push(q - W); }
        if (y < H - 1 && lab[q + W] === -1 && p[(q + W) * 4 + 3] >= 128) { lab[q + W] = id; st.push(q + W); }
      }
      out.push(px);
    }
    return out.filter((px) => px.length >= minArea).map((px) => features(d, px));
  }

  // Mesures d'une région : boîte, centre, axe principal, longueur, largeur, couleurs
  function features(d, px) {
    const W = d.width, p = d.data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, sx = 0, sy = 0;
    const col = Object.fromEntries(PAL_K.map((k) => [k, 0]));
    for (const q of px) {
      const x = q % W, y = (q / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; sx += x; sy += y;
      let best = null, bd = 1e9;
      for (const k of PAL_K) { const c = PAL[k], dd = (p[q * 4] - c[0]) ** 2 + (p[q * 4 + 1] - c[1]) ** 2 + (p[q * 4 + 2] - c[2]) ** 2; if (dd < bd) { bd = dd; best = k; } }
      col[best]++;
    }
    const n = px.length, cx = sx / n, cy = sy / n;
    let xx = 0, yy = 0, xy = 0;
    for (const q of px) { const dx = q % W - cx, dy = ((q / W) | 0) - cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
    const ang = 0.5 * Math.atan2(2 * xy, xx - yy);
    let u = [Math.cos(ang), Math.sin(ang)]; if (u[1] < 0 || (Math.abs(u[1]) < 1e-6 && u[0] < 0)) u = [-u[0], -u[1]]; // axe orienté vers le bas
    let pmin = 1e9, pmax = -1e9;
    for (const q of px) { const pr = (q % W - cx) * u[0] + (((q / W) | 0) - cy) * u[1]; if (pr < pmin) pmin = pr; if (pr > pmax) pmax = pr; }
    const length = pmax - pmin, width = n / Math.max(1, length);
    for (const k of PAL_K) col[k] /= n;
    return { px, n, box: [x0, y0, x1, y1], c: [cx, cy], u, pmin, pmax, length, width, col, role: null, note: '' };
  }

  // Centre d'un bout arrondi (haut : side = -1 ; bas : side = 1) le long de l'axe
  function capCenter(d, R, side, depth) {
    const W = d.width, dep = depth || R.width * 0.6; let sx = 0, sy = 0, n = 0;
    for (const q of R.px) {
      const x = q % W, y = (q / W) | 0, pr = (x - R.c[0]) * R.u[0] + (y - R.c[1]) * R.u[1];
      if (side < 0 ? pr <= R.pmin + dep : pr >= R.pmax - dep) { sx += x; sy += y; n++; }
    }
    return n ? [sx / n, sy / n] : R.c;
  }
  // Centre des pixels dans une bande horizontale (fraction de la hauteur de la boîte)
  function bandCenter(d, R, f0, f1) {
    const W = d.width, [, y0, , y1] = R.box, h = y1 - y0, a = y0 + h * f0, b = y0 + h * f1; let sx = 0, sy = 0, n = 0;
    for (const q of R.px) { const y = (q / W) | 0; if (y >= a && y <= b) { sx += q % W; sy += y; n++; } }
    return n ? [sx / n, sy / n] : R.c;
  }

  // Reconnaissance des rôles
  function classify(d, regs) {
    const W = d.width, H = d.height;
    regs.forEach((R) => { R.role = null; R.note = ''; });
    const free = () => regs.filter((R) => !R.role);
    const take = (R, role, note) => { if (R) { R.role = role; if (note) R.note = note; } return R; };
    const best = (list, score) => list.reduce((a, R) => { const s = score(R); return s > (a ? a.s : -1e9) ? { R, s } : a; }, null);
    // Modèle assemblé : la plus haute région du tiers gauche
    const left = regs.filter((R) => R.c[0] < W / 3 && (R.box[3] - R.box[1]) > H * 0.3);
    const model = best(left, (R) => R.box[3] - R.box[1]); take(model && model.R, 'modele');
    const elong = (R) => R.length / Math.max(1, R.width);
    // Corps : la plus grande région restante qui mêle plusieurs couleurs (pull, bouée…)
    const corps = best(free(), (R) => R.n * (1 - Math.max(...Object.values(R.col)) * 0.5) * (elong(R) < 3 ? 1 : 0.3)); take(corps && corps.R, 'corps');
    // Tête : ronde, peau crème + bonnet marine
    const tete = best(free(), (R) => (elong(R) < 2.2 ? 1 : 0) * Math.min(R.col.creme, 0.5) * Math.min(R.col.marine, 0.5) * Math.sqrt(R.n) * (R.col.vert + R.col.moutarde < 0.1 ? 1 : 0.2)); take(tete && tete.R, 'tete');
    // Membres entiers (avec main ou botte), à couper au coude ou au genou
    const arms = free().filter((R) => R.col.vert > 0.04 && elong(R) >= 2.6).sort((a, b) => b.length - a.length);
    const legs = free().filter((R) => R.col.moutarde > 0.1 && R.col.brique > 0.1 && elong(R) >= 2.6).sort((a, b) => b.length - a.length);
    if (arms[0]) take(arms[0], 'bras+avantbras', 'bras entier : coupé au coude');
    if (legs[0]) take(legs[0], 'jambe+mollet', 'jambe entière : coupée au genou');
    // Morceaux séparés, si pas de membre entier
    if (!arms[0]) {
      const ab = best(free(), (R) => R.col.vert * Math.sqrt(R.n)); if (ab && ab.s > 0) take(ab.R, 'avantbras');
      const br = best(free(), (R) => (R.col.vert < 0.02 && R.col.moutarde < 0.05 ? 1 : 0) * R.col.marine * elong(R) * Math.sqrt(R.n)); if (br && br.s > 0) take(br.R, 'bras');
    }
    if (!legs[0]) {
      const mo = best(free(), (R) => R.col.moutarde * Math.sqrt(R.n)); if (mo && mo.s > 0) take(mo.R, 'mollet');
      const je = best(free(), (R) => (R.col.vert < 0.02 && R.col.moutarde < 0.05 ? 1 : 0) * R.col.brique * elong(R) * Math.sqrt(R.n)); if (je && je.s > 0) take(je.R, 'jambe');
    }
    for (const R of free()) take(R, 'ignore', 'en trop');
  }

  // Coupe d'un membre entier : position du coude (rétrécissement) ou du genou (fin de la couleur de la cuisse)
  function jointPos(d, R, isLeg) {
    const W = d.width, p = d.data, L = R.length, N = 40, wid = new Float32Array(N), red = new Float32Array(N), grn = new Float32Array(N), cnt = new Float32Array(N);
    for (const q of R.px) {
      const x = q % W, y = (q / W) | 0, pr = (x - R.c[0]) * R.u[0] + (y - R.c[1]) * R.u[1], i = Math.min(N - 1, Math.floor((pr - R.pmin) / L * N));
      wid[i]++; cnt[i]++;
      const r = p[q * 4], g = p[q * 4 + 1], b = p[q * 4 + 2];
      if (r > 140 && g < 110 && b < 90) red[i]++;
      if (Math.abs(r - 127) < 40 && Math.abs(g - 168) < 40 && Math.abs(b - 154) < 40) grn[i]++;
    }
    if (isLeg) { // bas de la partie rouge (cuisse)
      let last = -1; for (let i = 0; i < N; i++) if (red[i] / Math.max(1, cnt[i]) > 0.3) last = i;
      if (last > N * 0.2 && last < N * 0.8) return R.pmin + (last + 0.5) / N * L - R.width * 0.35;
    }
    // Bras : coude au milieu entre l'épaule et le début de la main (première tranche surtout verte)
    let hand = -1; for (let i = Math.floor(N * 0.4); i < N; i++) if (grn[i] / Math.max(1, cnt[i]) > 0.3) { hand = i; break; }
    const hs = hand > 0 ? R.pmin + hand / N * L : R.pmin + L * 0.8;
    return R.pmin + (hs - R.pmin) * 0.5;
  }

  // Sépare une région en deux morceaux au point s (le long de l'axe), avec un bout arrondi pris dans l'image
  function split(d, R, s) {
    const W = d.width; let jx = 0, jy = 0, jn = 0;
    for (const q of R.px) { const x = q % W, y = (q / W) | 0, pr = (x - R.c[0]) * R.u[0] + (y - R.c[1]) * R.u[1]; if (Math.abs(pr - s) < 3) { jx += x; jy += y; jn++; } }
    const J = jn ? [jx / jn, jy / jn] : [R.c[0] + R.u[0] * s, R.c[1] + R.u[1] * s], r = R.width * 0.5, r2 = r * r;
    const up = [], low = [];
    for (const q of R.px) {
      const x = q % W, y = (q / W) | 0, pr = (x - R.c[0]) * R.u[0] + (y - R.c[1]) * R.u[1], near = (x - J[0]) ** 2 + (y - J[1]) ** 2 <= r2;
      if (pr <= s || near) up.push(q);
      if (pr >= s || near) low.push(q);
    }
    const A = features(d, up), B = features(d, low);
    A.joint = J; B.joint = J;
    return [A, B];
  }

  // Pivots et points d'attache par défaut, selon le rôle (coordonnées dans la planche)
  function defaults(d, R) {
    const [x0, y0, x1, y1] = R.box, h = y1 - y0;
    switch (R.role) {
      case 'corps': {
        const cou = capCenter(d, { ...R, u: [0, 1], pmin: y0 - R.c[1], pmax: y1 - R.c[1] }, -1, h * 0.06);
        const ep = bandCenter(d, R, 0.12, 0.2), ha = bandCenter(d, R, 0.82, 0.9);
        return { pivot: ha, points: { cou: [cou[0], cou[1] + h * 0.03], epaule: [cou[0], y0 + h * 0.16], hanche: [ep[0] * 0.3 + ha[0] * 0.7, y0 + h * 0.86] } };
      }
      case 'tete': { const nk = capCenter(d, { ...R, u: [0, 1], pmin: y0 - R.c[1], pmax: y1 - R.c[1] }, 1, h * 0.1); return { pivot: [nk[0], nk[1] - h * 0.04], points: {} }; }
      case 'bras': case 'jambe': return { pivot: R.topJ || capCenter(d, R, -1), points: { [R.role === 'bras' ? 'coude' : 'genou']: R.joint || capCenter(d, R, 1) } };
      case 'avantbras': return { pivot: R.joint || capCenter(d, R, -1), points: { main: capCenter(d, R, 1, R.width * 0.9) } };
      case 'mollet': return { pivot: R.joint || capCenter(d, R, -1), points: {} };
      case 'accessoire': return { pivot: R.c, points: {} };
    }
    return { pivot: R.c, points: {} };
  }

  // Analyse complète d'une planche
  function analyse(img) {
    const { canvas, data } = keyMagenta(img);
    let regs = regions(data);
    classify(data, regs);
    const extra = [];
    for (const R of regs) {
      if (R.role !== 'bras+avantbras' && R.role !== 'jambe+mollet') continue;
      const leg = R.role === 'jambe+mollet', [A, B] = split(data, R, jointPos(data, R, leg));
      A.role = leg ? 'jambe' : 'bras'; B.role = leg ? 'mollet' : 'avantbras';
      A.note = B.note = (leg ? 'coupé au genou' : 'coupé au coude') + ', à vérifier'; A.from = B.from = R;
      R.role = 'source'; extra.push(A, B);
    }
    regs = regs.filter((R) => R.role !== 'source').concat(extra);
    for (const R of regs) Object.assign(R, defaults(data, R));
    return { canvas, data, regs };
  }

  // Découpe un morceau en image (avec marge), coordonnées ramenées à l'image du morceau
  function extract(d, R, pad) {
    pad = pad || 4;
    const W = d.width, [x0, y0, x1, y1] = R.box, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), out = g.createImageData(w, h), src = d.data, dst = out.data;
    const inside = new Uint8Array(W * d.height); for (const q of R.px) inside[q] = 1;
    // pixels de la région + bord adouci (pixels semi-transparents voisins)
    for (let y = y0 - pad; y <= y1 + pad; y++) for (let x = x0 - pad; x <= x1 + pad; x++) {
      if (x < 0 || y < 0 || x >= W || y >= d.height) continue;
      const q = y * W + x; let ok = inside[q];
      if (!ok && src[q * 4 + 3] < 128) for (let dy = -1; dy <= 1 && !ok; dy++) for (let dx = -1; dx <= 1; dx++) { const qq = q + dy * W + dx; if (qq >= 0 && inside[qq]) { ok = 1; break; } }
      if (!ok) continue;
      const o = ((y - y0 + pad) * w + (x - x0 + pad)) * 4;
      dst[o] = src[q * 4]; dst[o + 1] = src[q * 4 + 1]; dst[o + 2] = src[q * 4 + 2]; dst[o + 3] = src[q * 4 + 3];
    }
    g.putImageData(out, 0, 0);
    const loc = (pt) => [Math.round(pt[0] - x0 + pad), Math.round(pt[1] - y0 + pad)];
    return { img: c, pivot: loc(R.pivot), points: Object.fromEntries(Object.entries(R.points || {}).map(([k, v]) => [k, loc(v)])) };
  }

  // Pantin prêt pour PANTIN.draw, à partir des morceaux retenus
  function puppet(d, regs, taille) {
    const parts = {};
    for (const R of regs) if (ROLES.includes(R.role) && !parts[R.role]) parts[R.role] = extract(d, R);
    if (!parts.corps) return null;
    return PANTIN.prepare({ taille, parts });
  }

  // ---------- Export : zip (sans compression) des PNG + JSON ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) { // files : [{ name, data: Uint8Array }]
    const enc = new TextEncoder(), chunks = [], central = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true);
      chunks.push(new Uint8Array(h.buffer), nm, f.data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + sz;
    }
    const cs = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
    return new Blob([...chunks, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }
  const pngBytes = (c) => new Promise((ok) => c.toBlob((b) => b.arrayBuffer().then((a) => ok(new Uint8Array(a))), 'image/png'));
  // Fichiers à mettre dans assets/equipage/ : nom_morceau.png + nom.json
  async function exportFiles(d, regs, nom, taille) {
    const files = [], json = { nom, taille, morceaux: {} };
    for (const R of regs) {
      if (!ROLES.includes(R.role) || json.morceaux[R.role]) continue;
      const e = extract(d, R), file = nom + '_' + R.role + '.png';
      files.push({ name: file, data: await pngBytes(e.img) });
      json.morceaux[R.role] = { img: file, pivot: e.pivot, ...(Object.keys(e.points).length ? { points: e.points } : {}) };
    }
    files.push({ name: nom + '.json', data: new TextEncoder().encode(JSON.stringify(json, null, 1)) });
    return files;
  }
  return { ROLES, analyse, features, split, jointPos, defaults, extract, puppet, exportFiles, zip };
})();
