// Souquez ! : éléments de l'écran (pads, carnet, bandeau, aide).
'use strict';
// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const cv = $('cv'), cx = cv.getContext('2d');
function applyTexts() {
  document.documentElement.lang = save.lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('ver').textContent = 'v' + VERSION + ' · Keismey Studio';
  buildBook(); buildPads();
}
function show(id, on) { $(id).hidden = !on; }
let overlayStack = [];
function openOverlay(id) { overlayStack.push(id); show(id, true); if (id === 'ovWin' && typeof focusFin !== 'undefined' && focusFin) focusFin.focus(); }
function closeOverlay() { const id = overlayStack.pop(); if (id) show(id, false); }

const GLYPH = {
  BOUM: '<circle cx="15" cy="15" r="11" fill="none" stroke="#fff" stroke-width="4"/>',
  TAK: '<rect x="4" y="12" width="22" height="6" rx="3" fill="#fff" transform="rotate(-30 15 15)"/>',
  DING: '<path d="M15 4 L26 25 H4 Z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>',
  CHH: '<circle cx="9" cy="10" r="3.5" fill="#fff"/><circle cx="20" cy="9" r="3.5" fill="#fff"/><circle cx="15" cy="20" r="3.5" fill="#fff"/>',
};
function buildPads() {
  // Pouce gauche : TAK (coin) + DING (intérieur, plus haut) ; pouce droit : BOUM (coin), puis CHH (intérieur) une fois débloqué. Inversé en mode gaucher.
  const on = (arr) => arr.filter(p => PADS_ON.includes(p));
  const left = on(save.lefty ? ['BOUM', 'CHH'] : ['TAK', 'DING']);
  const right = on(save.lefty ? ['DING', 'TAK'] : ['CHH', 'BOUM']);
  const box = $('pads'); box.innerHTML = '';
  for (const side of [left, right]) {
   const cl = document.createElement('div'); cl.className = 'cluster'; box.appendChild(cl);
   side.forEach((p, idx) => {
    const b = document.createElement('button'); b.className = 'pad' + ((side === left ? idx === 1 : idx === 0) && side.length > 1 ? ' inner' : ''); b.dataset.pad = p;
    b.innerHTML = '<svg class="glyph" viewBox="0 0 30 30" aria-hidden="true">' + GLYPH[p] + '</svg>' + p;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); onPad(p, e.timeStamp, b); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPad(p, performance.now(), b); } });
    cl.appendChild(b);
   });
  }
}
const KEYMAP = { f: 'TAK', j: 'BOUM', d: 'DING', k: 'CHH' };
document.addEventListener('keydown', (e) => {
  const p = KEYMAP[e.key.toLowerCase()]; if (!p || e.repeat || !PADS_ON.includes(p)) return;
  const b = document.querySelector('.pad[data-pad="' + p + '"]'); onPad(p, e.timeStamp, b);
});
function seqHtml(seq) { return seq.map(p => p ? '<i style="background:' + PADS[p] + '">' + p[0] + '</i>' : '<i class="rest">·</i>').join(''); }
function buildBook() {
  $('bookList').innerHTML = Object.entries(COMMANDS).filter(([id]) => typeof ordreOk !== 'function' || ordreOk(id)).map(([id, c]) =>
    '<div class="cmd"><div><b>' + t('cmd' + id) + '</b><span>' + t('cmd' + id + 'd') + '</span></div><div class="seq">' + seqHtml(c.seq) + '</div></div>').join('');
}
let bannerTimer = 0;
function banner(text, fail) {
  const b = $('banner'); b.textContent = text; b.classList.toggle('fail', !!fail); b.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 900);
}
function hint(text) { $('hint').textContent = text || ''; }
