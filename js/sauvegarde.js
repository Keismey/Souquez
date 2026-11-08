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
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return migrer(Object.assign(base, s)); }
  } catch (_) {}
  return migrer(base);
}
// Progression des mers (0.12) : missions[id] = { etoiles, temps, coque }, butin total, pièce rare du boss trouvée.
// Migration : la mission unique d'avant 0.12 est « Cap au large » (m4) ; ses étoiles (save.stars) y sont reportées.
// Une mission est ouverte si la précédente, ou une mission plus loin, a au moins 1 étoile (voir js/mer.js).
function migrer(s) {
  if (!s.missions || typeof s.missions !== 'object') s.missions = {};
  if (typeof s.butin !== 'number') s.butin = 0;
  if (typeof s.piece !== 'boolean') s.piece = false;
  if (!s.mig12) { if ((s.stars || 0) > 0 && !s.missions.m4) s.missions.m4 = { etoiles: s.stars }; s.mig12 = true; }
  return s;
}
const save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {} }
const t = (k) => (STR[save.lang] || STR.fr)[k] ?? STR.fr[k] ?? k;
