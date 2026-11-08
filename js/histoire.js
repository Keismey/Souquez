// Souquez ! : scènes d'histoire (bulles en bas d'écran). Textes dans js/dialogues.js (fichier de la Narration).
'use strict';
// Chaque scène ne se joue qu'une fois : save.seen garde celles déjà vues.
const sceneSeen = (id) => !!(save.seen && save.seen[id]);
let scene = null;
function playScene(id, done) {
  const lines = DIALOGUES[id];
  if (!lines || !lines.length || sceneSeen(id)) { done(); return; }
  scene = { id, lines, i: 0, done };
  openOverlay('ovDlg'); showLine();
}
function showLine() {
  const l = scene.lines[scene.i], who = PERSONNAGES[l.qui];
  $('ovDlg').classList.toggle('scene', l.qui === 'scene');
  $('dlgName').textContent = who ? (who[save.lang] || who.fr) : '';
  $('dlgText').textContent = l[save.lang] || l.fr;
}
function nextLine() { if (!scene) return; scene.i++; if (scene.i >= scene.lines.length) endScene(); else showLine(); }
function skipScene() { if (scene) endScene(); }
function endScene() {
  const s = scene; scene = null;
  save.seen = Object.assign({}, save.seen, { [s.id]: true }); persist();
  if (overlayStack[overlayStack.length - 1] === 'ovDlg') closeOverlay(); else show('ovDlg', false);
  s.done();
}
$('ovDlg').addEventListener('click', nextLine);
$('dlgSkip').addEventListener('click', (e) => { e.stopPropagation(); skipScene(); });
document.addEventListener('keydown', (e) => {
  if (!scene || e.repeat) return;
  if (e.key === 'Enter' || e.key === ' ') { if (e.target === $('dlgSkip')) return; e.preventDefault(); nextLine(); }
});
