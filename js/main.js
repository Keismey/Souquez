// Souquez ! : démarrage.
'use strict';
// ---------- Démarrage ----------
applyTexts(); renderSlots(); refreshOpts(); openOverlay('ovTitle');
requestAnimationFrame(frame);

// ---------- Mode hors ligne et mises à jour ----------
// Quand une nouvelle version prend la main, on recharge seulement sur l'écran titre (jamais en pleine partie).
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let updatePending = false;
  const onTitle = () => overlayStack.length === 1 && overlayStack[0] === 'ovTitle';
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) updatePending = true; });
  setInterval(() => { if (updatePending && onTitle() && !document.getElementById('ks-dlg')) { updatePending = false; location.reload(); } }, 1000);
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
