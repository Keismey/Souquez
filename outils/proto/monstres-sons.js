// Souquez ! : sons des monstres de la mer 1 et de Tonton Homard (prototype audio, hors du jeu).
// À charger APRÈS js/audio.js : utilise ctx, sfxBus, noise, envGain, osc.
// Contrat (un seul objet global, à la demande de la Programmation) :
//   AUDIO_MONSTRES.jouer(type, evt, at) -> durée en secondes (0 si rien à jouer).
//   type : 'sardine' | 'crache' | 'cogneur' | 'homard' | 'navire'
//   evt  : 'annonce'  (début du télégraphe, quand prepare part de 0)
//          'attaque'  (le coup ou le tir part)
//          'touche'   (le monstre est touché par le navire)
//          'coule'    (le monstre est vaincu)
//          Tonton Homard en plus : 'attaque2' (2e coup de la double pince), 'jet' (jet de vapeur), 'appel' (appelle les Sardines),
//          'colere' (passage en phase 3).
//          'navire' : 'coque' (la coque prend un coup), 'canon' (tir du navire).
// Tout passe par sfxBus (volume « Bruitages »).
'use strict';
const AUDIO_MONSTRES = (() => {
  const bus = () => sfxBus;
  // Note avec glissando : forme d'onde, fréquence de départ -> d'arrivée, enveloppe
  function glisse(type, f0, f1, at, dur, vol, att = 0.005, filtre) {
    const g = envGain(at, att, vol, dur, bus());
    let dst = g;
    if (filtre) { const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = filtre; b.connect(g); dst = b; }
    const o = osc(type, f0, at, dur + att, dst);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + att + dur);
    return o;
  }
  // Métal frappé : partiels inharmoniques qui s'éteignent à des vitesses différentes
  function metal(at, f, vol, dur) {
    [[1, 1, 1], [2.41, 0.6, 0.7], [3.87, 0.4, 0.45], [5.93, 0.22, 0.3]].forEach(([r, a, d]) =>
      osc('sine', f * r, at, dur * d + 0.05, envGain(at, 0.001, 0.22 * vol * a, dur * d, bus())));
    noise(at, 0.03, 'highpass', 3000, 0.7, envGain(at, 0.0005, 0.35 * vol, 0.025, bus()));
  }
  // Coup sourd (grosse masse)
  function sourd(at, f, vol, dur = 0.4) { glisse('sine', f, f * 0.42, at, dur, 0.9 * vol, 0.002); noise(at, 0.08, 'lowpass', 900, 0.7, envGain(at, 0.001, 0.6 * vol, 0.07, bus())); }
  // Vapeur : souffle filtré, qui monte ou descend
  function vapeur(at, dur, vol, f0 = 2500, f1 = 4500) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 0.9;
    b.frequency.setValueAtTime(f0, at); b.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.32 * vol, at + 0.04);
    g.gain.setTargetAtTime(0.0001, at + dur * 0.7, dur * 0.15);
    s.connect(b); b.connect(g); g.connect(bus()); s.start(at); s.stop(at + dur + 0.3);
  }
  // Sifflet de chaudière : deux notes proches, avec du souffle
  function sifflet(at, f, dur, vol, monte = 1.06) {
    [1, 1.26].forEach((r, i) => glisse('sine', f * r, f * r * monte, at, dur, (i ? 0.07 : 0.1) * vol, 0.04));
    vapeur(at, dur, 0.35 * vol, 3500, 4200);
  }
  // Bulles : petits « bloups » qui montent
  function bulles(at, n, vol, grave = 1) {
    for (let i = 0; i < n; i++) { const t = at + i * (0.05 + Math.random() * 0.07), f = (300 + Math.random() * 500) * grave;
      glisse('sine', f, f * 2.2, t, 0.05 + Math.random() * 0.04, 0.4 * vol, 0.004); }
  }
  // Hélice : bourdonnement haché
  function helice(at, dur, vol, f0, f1) {
    const g = envGain(at, 0.03, 0.12 * vol, dur, bus()), am = ctx.createGain(); am.gain.value = 0.6; am.connect(g);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.setValueAtTime(18, at); lfo.frequency.linearRampToValueAtTime(34, at + dur);
    lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain); lfo.start(at); lfo.stop(at + dur + 0.1);
    const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = 1400; b.connect(am);
    const o = osc('sawtooth', f0, at, dur + 0.05, b); o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  }
  // Grognement de bête (corne grave) : deux dents de scie filtrées
  function corne(at, f, dur, vol) {
    const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 2;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.25 * vol, at + 0.08); g.gain.setTargetAtTime(0.0001, at + dur * 0.8, 0.08);
    lp.connect(g); g.connect(bus());
    [1, 1.5].forEach((r) => { const o = osc('sawtooth', f * r, at, dur + 0.3, lp); o.frequency.setTargetAtTime(f * r * 0.94, at + dur * 0.5, 0.1); });
  }
  function canon(at, vol, grave = 1) {
    sourd(at, 95 * grave, 1.1 * vol, 0.5);
    noise(at, 0.35, 'lowpass', 1600, 0.6, envGain(at, 0.002, 0.8 * vol, 0.3, bus()));
    noise(at, 0.02, 'highpass', 2500, 0.7, envGain(at, 0.0005, 0.5 * vol, 0.015, bus()));
  }

  const SONS = {
    sardine: {
      annonce: (at) => { helice(at, 0.9, 2.2, 140, 420); vapeur(at, 0.25, 0.4, 3000, 3600); return 0.9; },          // l'hélice s'emballe
      attaque: (at) => { glisse('square', 900, 300, at, 0.06, 0.12, 0.002, 2500); glisse('square', 800, 260, at + 0.09, 0.06, 0.12, 0.002, 2500); sourd(at + 0.09, 160, 0.4, 0.15); return 0.3; }, // double croc
      touche:  (at) => { metal(at, 1250, 0.6, 0.25); glisse('triangle', 1300, 1900, at + 0.03, 0.08, 0.08); return 0.3; },
      coule:   (at) => { helice(at, 0.6, 1.5, 300, 60); vapeur(at, 0.5, 0.35, 3000, 1200); bulles(at + 0.2, 8, 0.8); return 1; }
    },
    crache: {
      annonce: (at) => { glisse('triangle', 180, 420, at, 0.8, 0.2, 0.05, 1200); vapeur(at, 0.8, 0.25, 600, 1500); return 0.8; }, // il gonfle, le canon chauffe
      attaque: (at) => { canon(at, 0.8, 1.15); glisse('sine', 1800, 700, at + 0.05, 0.35, 0.05); return 0.5; },                      // tir + boulon qui siffle
      touche:  (at) => { metal(at, 820, 0.7, 0.3); glisse('triangle', 500, 900, at + 0.04, 0.1, 0.09); return 0.35; },
      coule:   (at) => { glisse('sawtooth', 420, 90, at, 0.7, 0.1, 0.01, 1500); vapeur(at, 0.6, 0.3, 1200, 400); bulles(at + 0.3, 7, 0.8, 0.8); return 1.1; } // il se dégonfle
    },
    cogneur: {
      annonce: (at) => { for (let i = 0; i < 6; i++) { const t = at + i * 0.09 * (1 - i * 0.07); noise(t, 0.03, 'bandpass', 2400, 1.5, envGain(t, 0.001, 1.2, 0.03, bus())); osc('square', 1800, t, 0.012, envGain(t, 0.0005, 0.1, 0.01, bus())); } return 0.5; }, // cliquet : la pince se lève
      attaque: (at) => { sourd(at, 110, 1); metal(at, 430, 1.2, 1.2); return 1.2; },                                               // l'enclume sonne
      touche:  (at) => { metal(at, 610, 0.8, 0.5); return 0.5; },
      coule:   (at) => { corne(at, 70, 0.7, 0.6); metal(at + 0.1, 380, 0.5, 0.9); bulles(at + 0.4, 10, 0.8, 0.6); return 1.4; }
    },
    homard: {
      annonce: (at) => { sifflet(at, 1150, 1.1, 1, 1.08); [0, 0.28, 0.56].forEach((d) => sourd(at + d, 70, 0.35, 0.15)); return 1.1; }, // la chaudière monte en pression
      attaque: (at) => { vapeur(at - 0.05, 0.35, 0.8, 4000, 1500); sourd(at, 75, 1.3, 0.7); metal(at, 300, 1, 0.9); return 0.9; },   // marteau-pilon
      attaque2:(at) => { vapeur(at - 0.05, 0.3, 0.7, 4200, 1800); sourd(at, 90, 1.2, 0.6); metal(at, 360, 0.9, 0.8); return 0.8; },
      jet:     (at) => { vapeur(at, 0.9, 1, 1800, 5000); glisse('sine', 2200, 2600, at, 0.6, 0.04, 0.05); return 0.9; },
      appel:   (at) => { corne(at, 82, 0.6, 1); corne(at + 0.7, 82, 0.9, 1); return 1.6; },                                        // appelle les Sardines
      colere:  (at) => { sifflet(at, 1500, 0.8, 1.2, 1.25); corne(at + 0.1, 62, 0.9, 1); return 1; },
      touche:  (at) => { metal(at, 480, 0.9, 0.4); sourd(at, 140, 0.3, 0.15); return 0.4; },
      coule:   (at) => { sifflet(at, 1300, 1.4, 0.8, 0.5); corne(at + 0.2, 75, 1.4, 1); bulles(at + 0.6, 16, 1, 0.5); return 2; }
    },
    navire: {
      coque: (at) => { sourd(at, 120, 0.9, 0.3); noise(at, 0.12, 'bandpass', 900, 1.5, envGain(at, 0.001, 0.6, 0.1, bus())); metal(at + 0.01, 260, 0.5, 0.35); return 0.4; }, // bois et tôle
      canon: (at) => { canon(at, 0.7); return 0.5; }
    }
  };
  function jouer(type, evt, at) {
    if (!ctx) return 0;
    const f = SONS[type] && SONS[type][evt];
    if (!f) return 0;
    return f(Math.max(at || 0, ctx.currentTime + 0.01));
  }
  return { jouer, liste: () => Object.fromEntries(Object.entries(SONS).map(([k, v]) => [k, Object.keys(v)])) };
})();
