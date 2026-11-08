// Souquez ! : prototype des missions 2 à 4 de la mer 1 (phare, épave, port), formes simples pour le but.
// Chargé par outils/missions.html après les scripts du jeu et outils/proto/mers.js. Mission choisie par ?m=m2, m3 ou m4 (m1 aussi).
// Données reprises de MERS (mers.js) : portX, rencontres [type, x], temps de référence, butin, ordre appris, but.
// Le reste est le jeu tel quel (102 BPM, coque 20, pénalité du mode). Ordres appris, écran de fin et progression : outils/proto/boucle.js.
// La sauvegarde du jeu (koa.save) n'est jamais touchée.
'use strict';
const MISSIONS = MERS[0].missions.filter((m) => !m.boss);
const MISSION = (() => { const q = new URLSearchParams(location.search).get('m'); return MISSIONS.find((m) => m.id === q) || MISSIONS[1]; })();
const MLANG = () => (save.lang === 'en' ? 'en' : 'fr');
const ORDRE_NOM = { ADV: 'cmdADV', ATK: 'cmdATK', DEF: 'cmdDEF', HEAL: 'cmdHEAL' };
const BUT_NOM = { bouee: { fr: 'la bouée', en: 'the buoy' }, phare: { fr: 'le phare', en: 'the lighthouse' }, epave: { fr: 'l’épave', en: 'the wreck' }, port: { fr: 'le port', en: 'the harbour' } };

// Données de la mission dans le jeu (« V1 » = la mission actuelle du jeu, gardée telle quelle)
LEVEL.portX = MISSION.portX;
if (Array.isArray(MISSION.rencontres)) LEVEL.monsters = MISSION.rencontres.map(([type, x]) => ({ type, x }));
STARS.refTime = MISSION.ref;
// Étoile du but : « Phare atteint », « Épave atteinte »… au lieu de « Port atteint »
const BUT_ATTEINT = { bouee: { fr: 'Bouée atteinte', en: 'Buoy reached' }, phare: { fr: 'Phare atteint', en: 'Lighthouse reached' }, epave: { fr: 'Épave atteinte', en: 'Wreck reached' }, port: { fr: 'Port atteint', en: 'Harbour reached' } };
STR.fr.starPort = BUT_ATTEINT[MISSION.but].fr; STR.en.starPort = BUT_ATTEINT[MISSION.but].en;
// Sauvegarde du jeu intacte, et pas de scènes (elles appartiennent à la mission 1 et au boss)
persist = function () {};
save.seen = Object.assign({}, save.seen, { mer1_intro: true, mer1_attaque: true, mer1_plaque: true });

// Écran titre : nom de la mission, but, et choix de la mission
(function titre() {
  const L = MLANG(), h = document.querySelector('#ovTitle h1'), p = document.querySelector('#ovTitle p');
  h.textContent = MISSION.nom[L];
  p.textContent = (L === 'en' ? 'Mission prototype: reach ' : 'Prototype de mission : atteindre ') + BUT_NOM[MISSION.but][L] + '.';
  const sel = document.createElement('select');
  sel.setAttribute('aria-label', L === 'en' ? 'Mission' : 'Mission');
  sel.style.cssText = 'margin-top:10px;font:inherit;font-size:15px;padding:6px 8px;border-radius:8px;max-width:100%';
  for (const m of MISSIONS) { const o = document.createElement('option'); o.value = m.id; o.textContent = m.nom[L]; o.selected = m === MISSION; sel.appendChild(o); }
  sel.onchange = () => { location.search = '?m=' + sel.value; };
  p.after(sel);
})();

// But au bout de la mer, dessiné à la place du fort (formes simples en attendant la DA). lit : 0..1, s'allume à l'arrivée.
function drawGoal(fx, lit) {
  const b = MISSION.but, w = Math.sin(tAmb * 1.6);
  cx.save();
  if (b === 'bouee') {
    cx.translate(fx, SEA + 6 + w * 3); cx.rotate(w * 0.08);
    C('#b5452f'); cx.fillRect(-14, -60, 28, 50); C('#f2e6cc'); cx.fillRect(-14, -45, 28, 12);
    C('#1f2a44'); cx.fillRect(-2, -84, 4, 26); C(lit ? mix('#e0a82e', '#ffd447', lit) : '#e0a82e'); cx.beginPath(); cx.arc(0, -86, 7, 0, 7); cx.fill();
    C('#1f2a44'); cx.beginPath(); cx.ellipse(0, -8, 24, 9, 0, 0, 7); cx.fill();
  } else if (b === 'phare') {
    cx.translate(fx, SEA);
    C('#3d4a4f'); cx.beginPath(); cx.ellipse(0, 4, 90, 22, 0, Math.PI, 0); cx.fill(); // rocher
    for (let i = 0; i < 5; i++) { // tour à bandes, qui s'affine en montant
      const y0 = -i * 36, w0 = 30 - i * 3, w1 = 30 - (i + 1) * 3;
      C(i % 2 ? '#f2e6cc' : '#b5452f'); cx.beginPath(); cx.moveTo(-w0, y0); cx.lineTo(w0, y0); cx.lineTo(w1, y0 - 36); cx.lineTo(-w1, y0 - 36); cx.fill();
    }
    C('#1f2a44'); cx.fillRect(-22, -192, 44, 8); cx.fillRect(-16, -222, 32, 4);
    const glow = 0.55 + 0.45 * lit;
    C('rgba(255,214,120,' + glow + ')'); cx.fillRect(-14, -218, 28, 26);
    C('#1f2a44'); cx.beginPath(); cx.moveTo(-18, -222); cx.lineTo(0, -240); cx.lineTo(18, -222); cx.fill();
    // faisceau qui balaie la mer
    const a = Math.sin(tAmb * 0.9) * 0.6;
    cx.globalAlpha = 0.18 + 0.2 * lit; C('#ffd98a'); cx.beginPath(); cx.moveTo(0, -205);
    cx.lineTo(-420 * Math.cos(a), -205 - 60 + 420 * Math.sin(a) * 0.3); cx.lineTo(-420 * Math.cos(a), -205 + 60 + 420 * Math.sin(a) * 0.3); cx.fill();
  } else if (b === 'epave') {
    cx.translate(fx, SEA + 16); cx.rotate(-0.18 + w * 0.02);
    C('#3a2e28'); cx.beginPath(); cx.moveTo(-110, -20); cx.lineTo(90, -46); cx.lineTo(70, 10); cx.lineTo(-90, 20); cx.fill(); // coque à moitié coulée
    C('#5a463a'); for (let i = 0; i < 4; i++) cx.fillRect(-80 + i * 40, -30 - i * 4, 22, 6);
    C('#24425a'); cx.beginPath(); cx.arc(-10, -10, 9, 0, 7); cx.fill(); // trou dans la coque
    C('#3a2e28'); cx.fillRect(10, -150, 7, 110); cx.save(); cx.translate(13, -120); cx.rotate(0.5); cx.fillRect(-40, -3, 70, 5); cx.restore(); // mât cassé
    C(lit ? mix('#b5452f', '#ffd447', lit) : '#b5452f'); cx.beginPath(); cx.moveTo(17, -150); cx.lineTo(52, -138 + w * 4); cx.lineTo(17, -128); cx.fill(); // lambeau de pavillon
  } else { // port : quai, phare de jetée, entrepôt
    cx.translate(fx, SEA);
    C('#5a463a'); cx.fillRect(-60, -18, 260, 18); C('#3a2e28'); for (let i = 0; i < 6; i++) cx.fillRect(-56 + i * 48, -18, 8, 50);
    C('#4a4a52'); cx.fillRect(20, -110, 120, 92); C('#b5452f'); cx.beginPath(); cx.moveTo(10, -110); cx.lineTo(80, -150); cx.lineTo(150, -110); cx.fill();
    C('#2a2a30'); for (let i = 0; i < 3; i++) cx.fillRect(36 + i * 34, -80, 16, 22);
    C('#f2e6cc'); cx.fillRect(-50, -90, 16, 72); C(lit ? mix('#e0a82e', '#ffd447', lit) : '#e0a82e'); cx.fillRect(-54, -102, 24, 12);
  }
  cx.restore();
}
