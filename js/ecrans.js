// Souquez ! : écrans, pause et menu Options.
'use strict';
// ---------- Écrans ----------
function startPlay(mode) { overlayStack.forEach(id => show(id, false)); overlayStack = []; if (ctx) ctx.resume(); newGame(mode); }
$('playBtn').onclick = () => { initAudio(); goFullscreen(); startPlay(save.offset == null ? 'calib' : 'play'); };
$('calBtn').onclick = () => { initAudio(); goFullscreen(); startPlay('calib'); };
$('recalBtn').onclick = () => { initAudio(); startPlay('calib'); };
$('optBtn1').onclick = () => { refreshOpts(); openOverlay('ovOpts'); };
// Installation PWA : le bouton n'apparaît que si le navigateur propose l'installation (pas dans l'appli installée)
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('installBtn').hidden = false; });
window.addEventListener('appinstalled', () => { installEvt = null; $('installBtn').hidden = true; });
$('installBtn').onclick = async () => {
  if (!installEvt) return;
  installEvt.prompt();
  try { await installEvt.userChoice; } catch (_) {}
  installEvt = null; $('installBtn').hidden = true;
};
$('optBtn2').onclick = () => { refreshOpts(); openOverlay('ovOpts'); };
$('optClose').onclick = closeOverlay;
$('bookBtn').onclick = () => { if (G && !G.paused) pause(); openOverlay('ovBook'); };
$('bookClose').onclick = () => { closeOverlay(); if (G && G.paused && !overlayStack.length) resume(); };
$('pauseBtn').onclick = () => { if (G && !G.won && !G.paused) { pause(); openOverlay('ovPause'); } };
$('resumeBtn').onclick = () => { closeOverlay(); resume(); };
$('restartBtn').onclick = () => { closeOverlay(); if (ctx) ctx.resume(); newGame('play'); };
function goFullscreen() {
  try {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_) {} }).catch(() => {});
  } catch (_) {}
}
function toTitle() { overlayStack.forEach(id => show(id, false)); overlayStack = []; stopMusic(); G = null; if (ctx) ctx.resume(); renderSlots(); $('phase').textContent = ''; openOverlay('ovTitle'); }
$('titleBtn').onclick = toTitle; $('titleBtn2').onclick = toTitle;
$('againBtn').onclick = () => { closeOverlay(); newGame('play'); };
function pause() { if (!G || G.paused) return; G.paused = true; if (ctx) ctx.suspend(); }
function resume() {
  if (!G || !G.paused) return;
  // On repart sur une mesure d'écoute vide, puis le joueur reprend la main
  ctx.resume().then(() => {
    if (!G) return;
    if (G.mode === 'calib') { newGame('calib'); return; }
    // On repart sur un tempo propre : commande et réponse en cours oubliées, combo gardé
    const k = Math.max(4, G.lastVis + 1);
    G.start = ctx.currentTime + 0.6 - k * SPB; G.lastSched = k - 1; G.lastVis = k - 1;
    G.phrase = null; G.resp = null; G.gridK = k; G.lastRespEnd = G.combo > 0 ? k : -99;
    startMusic(k);
    G.paused = false;
  });
}
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.paused && !G.won) { pause(); openOverlay('ovPause'); } });

function refreshOpts() {
  $('oMusic').value = save.music; $('oSfx').value = save.sfx; $('oVib').checked = save.vib;
  $('oLefty').checked = save.lefty; $('oAssist').checked = save.assist; $('oFrame').checked = !!save.frame; $('oTick').checked = !!save.tick; $('oVoices').checked = save.voices !== false; $('oLang').value = save.lang;
  $('oLat').textContent = save.offset == null ? '—' : Math.round(save.offset * 1000) + ' ms';
}
$('oMusic').oninput = (e) => { save.music = +e.target.value; applyVolumes(); persist(); };
$('oSfx').oninput = (e) => { save.sfx = +e.target.value; applyVolumes(); persist(); };
$('oVib').onchange = (e) => { save.vib = e.target.checked; persist(); };
$('oLefty').onchange = (e) => { save.lefty = e.target.checked; persist(); buildPads(); };
$('oAssist').onchange = (e) => { save.assist = e.target.checked; persist(); };
$('oFrame').onchange = (e) => { save.frame = e.target.checked; persist(); };
$('oTick').onchange = (e) => { save.tick = e.target.checked; persist(); };
$('oVoices').onchange = (e) => { save.voices = e.target.checked; persist(); };
$('oLang').onchange = (e) => { save.lang = e.target.value; persist(); applyTexts(); renderSlots(); };
