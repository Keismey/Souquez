// Souquez ! : langue, sauvegarde locale et traduction.
'use strict';
// ---------- Sauvegarde ----------
function defLang() {
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'fr' || q === 'en') return q; } catch (_) {}
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
function loadSave() {
  const base = { v: 1, lang: defLang(), music: 70, sfx: 90, vib: true, lefty: false, assist: false, frame: false, tick: false, voices: true, offset: null, best: 0 };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return Object.assign(base, s); }
  } catch (_) {}
  return base;
}
const save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {} }
const t = (k) => (STR[save.lang] || STR.fr)[k] ?? STR.fr[k] ?? k;
