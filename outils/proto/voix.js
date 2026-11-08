// Souquez ! : voix des personnages et jingles (prototype audio, hors du jeu).
// À charger APRÈS js/audio.js : utilise ctx, sfxBus, noiseBuf, noise, envGain, osc, playPad.
// Contrat :
//   parler(qui, texte, at)  -> durée en secondes. qui = clé de PERSONNAGES (hortense, gaston, doc, pepin, vieux).
//                              Baragouin calé sur les voyelles du texte (FR ou EN), pas de vraies paroles.
//   jingle(nom, at, n)      -> durée en secondes. nom = 'victoire' | 'defaite' | 'etoile' (n = 1, 2 ou 3).
// Les voix respectent save.voices (comme le chœur) ; tout passe par sfxBus (volume « Bruitages »).
'use strict';

// ---------- Réglages des voix ----------
// f0 : hauteur de base (Hz) ; fmt : décalage des formants (taille du gosier) ; syl : durée d'une syllabe (s) ;
// tenue : part de la syllabe où la voix sonne (petit = haché, sec) ; ecart : variation de hauteur entre syllabes ;
// pente : hauteur en fin de phrase (< 1 descend, > 1 monte) ; vib : [vitesse Hz, profondeur] ;
// souffle : bruit d'air ; brillance : coupe des aigus (Hz) ; hesite : chance d'une petite pause ; vol : volume.
const VOIX = {
  hortense: { f0: 128, fmt: 0.9,  onde: 'sawtooth', syl: 0.082, tenue: 0.5,  ecart: 0.10, pente: 0.82, vib: [0, 0],     souffle: 0.25, brillance: 2400, hesite: 0,    vol: 1.3 },
  gaston:   { f0: 290, fmt: 1.1,  onde: 'sawtooth', syl: 0.066, tenue: 0.85, ecart: 0.34, pente: 1.18, vib: [7, 0.025], souffle: 0.15, brillance: 4200, hesite: 0,    vol: 0.9 },
  doc:      { f0: 205, fmt: 1.02, onde: 'triangle', syl: 0.105, tenue: 0.95, ecart: 0.16, pente: 0.96, vib: [5, 0.012], souffle: 0.35, brillance: 2600, hesite: 0,    vol: 1.15 },
  pepin:    { f0: 410, fmt: 1.28, onde: 'triangle', syl: 0.078, tenue: 0.75, ecart: 0.22, pente: 1.06, vib: [11, 0.04], souffle: 0.3,  brillance: 3800, hesite: 0.22, vol: 0.35 },
  vieux:    { f0: 108, fmt: 0.88, onde: 'sawtooth', syl: 0.13,  tenue: 0.9,  ecart: 0.12, pente: 0.88, vib: [4.5, 0.05], souffle: 0.6, brillance: 1700, hesite: 0.12, vol: 1.3 }
};
// Formants (Hz) des voyelles, voix moyenne
const FORMANTS = { a: [780, 1200, 2700], e: [430, 1850, 2550], i: [310, 2150, 2950], o: [470, 820, 2650], u: [340, 760, 2400] };

// Découpe le texte en syllabes : une syllabe par groupe de voyelles, avec la consonne qui la précède et la ponctuation qui suit
function syllabes(texte) {
  const s = texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const out = []; let cons = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if ('aeiouy'.includes(c)) {
      let j = i; while (j < s.length && 'aeiouy'.includes(s[j])) j++;
      const g = s.slice(i, j);
      const v = g.includes('ou') ? 'u' : g[0] === 'y' ? 'i' : g[0];
      out.push({ v, cons, pause: 0, fin: '' }); cons = ''; i = j; continue;
    }
    if (/[a-z]/.test(c)) cons = c;
    else if (out.length && /[.!?…,;:]/.test(c)) {
      const d = out[out.length - 1];
      if (c === ',' || c === ';' || c === ':') d.pause = Math.max(d.pause, 1.2);
      else { d.pause = 2.4; d.fin = c === '!' ? '!' : c === '?' ? '?' : '.'; }
    } else if (c === ' ' && out.length) out[out.length - 1].pause = Math.max(out[out.length - 1].pause, 0.15);
    i++;
  }
  return out.slice(0, 22);
}
// Hasard reproductible : la même phrase sonne toujours pareil
function graine(txt) { let h = 2166136261; for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

function parler(qui, texte, at) {
  if (!ctx || (typeof save !== 'undefined' && save.voices === false)) return 0;
  const P = VOIX[qui] || VOIX.gaston, rnd = graine(qui + texte), syl = syllabes(texte);
  if (!syl.length) return 0;
  at = Math.max(at || 0, ctx.currentTime + 0.02);
  // Chaîne : oscillateur (+ vibrato) -> 3 formants en parallèle + un peu de son direct -> coupe-aigus -> enveloppe -> sortie
  const o = ctx.createOscillator(); o.type = P.onde;
  const sortie = ctx.createGain(); sortie.gain.value = P.vol; sortie.connect(sfxBus);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = P.brillance; lp.Q.value = 0.5;
  const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, at); env.connect(sortie); lp.connect(env);
  const direct = ctx.createGain(); direct.gain.value = P.onde === 'triangle' ? 0.25 : 0.08; o.connect(direct); direct.connect(lp);
  const filtres = [0, 1, 2].map((k) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 7 + k * 3;
    const gk = ctx.createGain(); gk.gain.value = [1, 0.7, 0.35][k]; o.connect(b); b.connect(gk); gk.connect(lp); return b; });
  if (P.vib[0]) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = P.vib[0]; lg.gain.value = P.f0 * P.vib[1]; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + 8); }
  let t = at; const n = syl.length;
  syl.forEach((s, i) => {
    const pos = n > 1 ? i / (n - 1) : 1;
    let f = P.f0 * (1 + (rnd() - 0.5) * 2 * P.ecart) * (1 + (P.pente - 1) * pos);
    let a = 0.8 * (0.85 + rnd() * 0.3), d = P.syl * (0.85 + rnd() * 0.3);
    if (s.fin === '!') { f *= 1.22; a *= 1.3; d *= 1.5; }
    if (s.fin === '?') { f *= 1.3; d *= 1.4; }
    if (s.fin === '.') { f *= 0.94; d *= 1.3; }
    const F = FORMANTS[s.v];
    o.frequency.setTargetAtTime(f, t, 0.012);
    filtres.forEach((b, k) => b.frequency.setTargetAtTime(F[k] * P.fmt, t, 0.014));
    env.gain.setTargetAtTime(a, t, 0.008);
    env.gain.setTargetAtTime(0.0001, t + d * P.tenue, P.tenue < 0.7 ? 0.01 : 0.022);
    // consonne d'attaque : sifflante, plosive ou rien
    const c = s.cons;
    if ('scfz'.includes(c) && c) noise(t - 0.01, 0.05, 'highpass', 4200, 0.8, envGain(t - 0.01, 0.006, 0.09 * P.vol, 0.045, sortie));
    else if ('ptkbdgq'.includes(c) && c) noise(t - 0.004, 0.02, 'bandpass', 1600 * P.fmt, 1.2, envGain(t - 0.004, 0.001, 0.14 * P.vol, 0.018, sortie));
    if (P.souffle) noise(t, d * P.tenue, 'bandpass', 2600 * P.fmt, 0.9, envGain(t, 0.01, 0.03 * P.souffle * P.vol, d * P.tenue, sortie));
    t += d + s.pause * P.syl * 0.6;
    if (P.hesite && rnd() < P.hesite && i < n - 1) t += P.syl * 1.4;
  });
  o.start(at); o.stop(t + 0.15);
  return t - at;
}

// ---------- Jingles (fanfare synthétique : cuivres, tuba, grosse caisse) ----------
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // numéro MIDI -> Hz
// Une note de cuivre : 2 dents de scie désaccordées, filtre qui s'ouvre puis se pose (le « souffle » du cuivre)
function cuivre(at, midi, dur, vol = 1, sourd = false) {
  const f = NOTE(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 1.2;
  const ouv = sourd ? 900 : Math.min(5200, f * 6);
  lp.frequency.setValueAtTime(f * 1.2, at); lp.frequency.linearRampToValueAtTime(ouv, at + 0.05); lp.frequency.setTargetAtTime(ouv * 0.6, at + 0.06, 0.1);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.1 * vol, at + 0.035);
  g.gain.setTargetAtTime(0.078 * vol, at + 0.05, 0.08); g.gain.setTargetAtTime(0.0001, at + dur, 0.05);
  lp.connect(g); g.connect(sfxBus);
  [-6, 6].forEach((ct) => { const o = osc('sawtooth', f, at, dur + 0.3, lp); o.detune.value = ct; });
  return g;
}
function tuba(at, midi, dur, vol = 1) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.28 * vol, at + 0.03); g.gain.setTargetAtTime(0.0001, at + dur, 0.05);
  lp.connect(g); g.connect(sfxBus); osc('sawtooth', NOTE(midi), at, dur + 0.3, lp);
}
// Clochette claire (glockenspiel) pour les étoiles
function glock(at, midi, vol = 1) {
  const f = NOTE(midi);
  [[1, 0.22, 0.9], [2.76, 0.07, 0.35], [5.4, 0.025, 0.15]].forEach(([r, a, d]) => osc('sine', f * r, at, d + 0.05, envGain(at, 0.002, a * vol, d, sfxBus)));
}

function jingle(nom, at, n) {
  if (!ctx) return 0;
  at = Math.max(at || 0, ctx.currentTime + 0.03);
  const b = 60 / 102 / 2; // une croche à 102 BPM
  if (nom === 'victoire') { // fanfare montante en si bémol majeur, finit sur un accord tenu
    [[65, 0, 1], [70, 1, 1], [74, 2, 1], [77, 3, 2], [74, 5, 1], [77, 6, 6]].forEach(([m, k, l]) => cuivre(at + k * b, m, l * b * 0.92, 1));
    [[70 - 12, 6], [74 - 12, 6]].forEach(([m, l]) => cuivre(at + 6 * b, m, l * b, 0.7));
    [[46, 0, 3], [41, 3, 3], [46, 6, 6]].forEach(([m, k, l]) => tuba(at + k * b, m, l * b * 0.9));
    [0, 3, 6].forEach((k) => playPad('BOUM', at + k * b, 0.8));
    [5, 5.5].forEach((k) => playPad('TAK', at + k * b, 0.5));
    noise(at + 6 * b, 1.2, 'highpass', 6000, 0.6, envGain(at + 6 * b, 0.004, 0.18, 1.1, sfxBus)); // cymbale
    return 12 * b;
  }
  if (nom === 'defaite') { // trombone bouché qui descend, drôle et pas cruel (pas de game over)
    const notes = [[67, 0, 2], [66, 2, 2], [65, 4, 2], [64, 6, 6]];
    notes.forEach(([m, k, l], i) => {
      const g = cuivre(at + k * b, m - 12, l * b * 0.95, 1.2, true);
      if (i === 3) { const w = ctx.createOscillator(), wg = ctx.createGain(); w.frequency.value = 6; wg.gain.value = 0.05; w.connect(wg); wg.connect(g.gain); w.start(at + k * b); w.stop(at + 12 * b); }
    });
    tuba(at, 43, 4 * b * 0.9, 0.8); tuba(at + 6 * b, 40, 6 * b, 0.8);
    playPad('BOUM', at + 6 * b, 0.5, 0.8);
    return 12 * b;
  }
  if (nom === 'etoile') { // arpège brillant, un cran plus haut à chaque étoile
    n = Math.max(1, Math.min(3, n || 1));
    const base = [84, 88, 91][n - 1];
    [0, 4, 7, 12].forEach((iv, i) => glock(at + i * 0.07, base + iv, 0.9 + i * 0.1));
    cuivre(at, base - 24 + 7, 0.25, 0.45);
    return 0.6;
  }
  return 0;
}
