// Souquez ! : son (tambours, musique, voix de l'équipage, latence).
'use strict';
// ---------- Audio ----------
let ctx = null, musicBus, sfxBus, noiseBuf;
function initAudio() {
  if (ctx) { if (ctx.state === 'suspended' && !(G && G.paused)) ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC({ latencyHint: 'interactive' });
  musicBus = ctx.createGain(); sfxBus = ctx.createGain();
  musicBus.connect(ctx.destination);
  // Tambours : compresseur + gain de rattrapage pour plus d'impact, et une petite salle (réverbération courte)
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 6; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.12;
  const makeup = ctx.createGain(); makeup.gain.value = 1.6;
  sfxBus.connect(comp); comp.connect(makeup); makeup.connect(ctx.destination);
  const rl = Math.floor(ctx.sampleRate * 0.5), ir = ctx.createBuffer(2, rl, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3); }
  roomBus = ctx.createGain(); roomBus.gain.value = 0.18; const conv = ctx.createConvolver(); conv.buffer = ir; roomBus.connect(conv); conv.connect(comp);
  drive = ctx.createWaveShaper(); const n = 1024, cv2 = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cv2[i] = Math.tanh(2.6 * x) / Math.tanh(2.6); } drive.curve = cv2; drive.connect(sfxBus);
  const len = ctx.sampleRate; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  applyVolumes();
  loadMusic();
}
// ---------- Musique ----------
let musicBuf = null, musicSrc = null;
// Le fichier est téléchargé dès l'ouverture, puis décodé quand le son est autorisé (premier toucher)
const musicBytes = fetch(MUS_URL).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status));
musicBytes.catch(() => {});
function loadMusic() {
  musicBytes.then(b => new Promise((ok, ko) => ctx.decodeAudioData(b, ok, ko)))
    .then(buf => { musicBuf = buf; }).catch(() => {});
}
function stopMusic(fade) {
  if (!musicSrc) return;
  const src = musicSrc, g = src._g; musicSrc = null;
  try { if (fade) { g.gain.setTargetAtTime(0, ctx.currentTime, 0.3); src.stop(ctx.currentTime + 1.5); } else src.stop(); } catch (_) {}
}
// Démarre la musique pour que le temps k du jeu tombe sur un temps de la musique
function startMusic(k) {
  if (!musicBuf || !G || G.mode !== 'play') return;
  stopMusic();
  const loop = MUS_BEATS * SPB, at = Math.max(beatTime(k), ctx.currentTime + 0.05);
  const kk = (at - G.start) / SPB;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = musicBuf; src.loop = true; src.loopStart = MUS_OFF; src.loopEnd = MUS_OFF + loop;
  src.connect(g); g.connect(musicBus); src._g = g;
  src.start(at, MUS_OFF + (((kk * SPB) % loop) + loop) % loop);
  musicSrc = src;
}
// ---------- Voix de l'équipage (synthèse de formants, une petite foule de 5 voix) ----------
const VOWELS = { a: [800, 1150, 2800], o: [450, 800, 2830], e: [400, 1900, 2600], i: [300, 2200, 3000], u: [330, 700, 2500] };
function voice(at, vowel, f0, dur, vol = 1, glide = 0, n = 5) {
  if (!ctx || save.voices === false) return;
  const F = VOWELS[vowel];
  for (let v = 0; v < n; v++) {
    const t0 = at + Math.random() * 0.03, pf = f0 * (0.82 + v * 0.1) * (1 + (Math.random() - 0.5) * 0.04);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(pf, t0);
    if (glide) o.frequency.linearRampToValueAtTime(pf * glide, t0 + dur * 0.7);
    else o.frequency.linearRampToValueAtTime(pf * 0.92, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05 * vol, t0 + 0.02);
    g.gain.setValueAtTime(0.05 * vol, t0 + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    F.forEach((f, i) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f * (1 + v * 0.02); b.Q.value = 6 + i * 3; o.connect(b); b.connect(g); });
    g.connect(sfxBus); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  noise(at, 0.04, 'highpass', 1800, 0.7, envGain(at, 0.003, 0.12 * vol, 0.04, sfxBus)); // le « h » d'attaque
}
// Syllabe chantée par l'équipage pour chaque tambour
const CHANT = { BOUM: ['o', 150], TAK: ['e', 210], DING: ['i', 270], CHH: ['a', 190] };
function chant(pad, at) { const [v, f] = CHANT[pad]; voice(at, v, f, 0.22, 1); }
function cheer(at, big) { voice(at, 'u', 230, big ? 0.7 : 0.45, 1.1, big ? 1.8 : 1.5, big ? 7 : 5); voice(at + (big ? 0.35 : 0.22), 'o', 300, 0.35, 0.8, 0.7, big ? 7 : 5); }
function groan(at) { voice(at, 'o', 170, 0.5, 0.8, 0.6); }
function applyVolumes() { if (!ctx) return; musicBus.gain.value = save.music / 100; sfxBus.gain.value = save.sfx / 100; }
function envGain(at, a, peak, dec, bus) {
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + dec); g.connect(bus); return g;
}
function osc(type, f, at, dur, g) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at); o.connect(g); o.start(at); o.stop(at + dur + 0.05); return o; }
function noise(at, dur, filterType, freq, q, g) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter();
  f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1; s.connect(f); f.connect(g); s.start(at); s.stop(at + dur + 0.05);
}
let roomBus = null, drive = null;
function playPad(pad, at, vol = 1, pitch = 1, bus = sfxBus) {
  const send = (g) => { if (roomBus && bus === sfxBus) g.connect(roomBus); return g; };
  switch (pad) {
    case 'BOUM': { // grosse caisse de bord : corps grave saturé, deuxième harmonique et attaque
      const dst = bus === sfxBus && drive ? drive : bus;
      const g = send(envGain(at, 0.003, 1.0 * vol, 0.6, dst)); const o = osc('sine', 125 * pitch, at, 0.65, g); o.frequency.exponentialRampToValueAtTime(46 * pitch, at + 0.32);
      const g2 = envGain(at, 0.002, 0.3 * vol, 0.22, dst); const o2 = osc('triangle', 250 * pitch, at, 0.25, g2); o2.frequency.exponentialRampToValueAtTime(90 * pitch, at + 0.18);
      noise(at, 0.06, 'lowpass', 2200, 0.7, send(envGain(at, 0.001, 0.7 * vol, 0.05, bus)));
      osc('square', 1400 * pitch, at, 0.01, envGain(at, 0.0005, 0.12 * vol, 0.008, bus)); break; }
    case 'TAK': { // bloc de bois claqué : éclat, corps boisé et petite résonance
      noise(at, 0.06, 'bandpass', 3300 * pitch, 2.5, send(envGain(at, 0.0008, 1.3 * vol, 0.05, bus)));
      const g = send(envGain(at, 0.001, 0.75 * vol, 0.11, bus)); const o = osc('sine', 880 * pitch, at, 0.13, g); o.frequency.exponentialRampToValueAtTime(760 * pitch, at + 0.1);
      osc('triangle', 1960 * pitch, at, 0.07, envGain(at, 0.0008, 0.4 * vol, 0.06, bus)); break; }
    case 'DING': { // cloche de navire, adoucie : plus grave, aigus discrets, attaque feutrée
      [[1, 0.32, 1.0], [2.32, 0.1, 0.5], [4.25, 0.035, 0.25]].forEach(([r, a, d]) => osc('sine', 520 * r * pitch, at, d + 0.05, send(envGain(at, 0.006, a * vol, d, bus))));
      osc('sine', 260 * pitch, at, 0.4, envGain(at, 0.004, 0.18 * vol, 0.35, bus)); break; }
    case 'CHH': { // chaîne secouée : double frottement métallique
      [0, 0.035].forEach((dt, i) => noise(at + dt, 0.14, 'bandpass', 6500 * pitch, 1.1, send(envGain(at + dt, 0.004, (i ? 0.7 : 1) * vol, 0.11, bus))));
      noise(at, 0.06, 'highpass', 9000, 0.7, envGain(at, 0.001, 0.5 * vol, 0.04, bus)); break; }
  }
}
function tick(at, accent) {
  osc('sine', accent ? 1568 : 1046, at, 0.05, envGain(at, 0.001, accent ? 0.28 : 0.18, 0.04, musicBus));
  if (accent) osc('sine', 55, at, 0.35, envGain(at, 0.01, 0.6, 0.3, musicBus));
}
// Temps audible (ce que le joueur entend en ce moment), en temps du contexte audio
function audibleAt(perfMs) {
  try {
    const fb = ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0) + (perfMs - performance.now()) / 1000;
    if (ctx.getOutputTimestamp) {
      const ts = ctx.getOutputTimestamp();
      if (ts.performanceTime > 0 && ts.contextTime > 0) { const v = ts.contextTime + (perfMs - ts.performanceTime) / 1000; if (Math.abs(v - fb) < 0.25) return v; }
    }
    return fb;
  } catch (_) {}
  return ctx.currentTime;
}
function vibrate(ms) { if (!save.vib) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} }
