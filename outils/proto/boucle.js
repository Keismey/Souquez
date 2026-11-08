// Souquez ! : boucle de la mer 1 hors du jeu : carte → mission ou boss → écran de fin → carte.
// Chargé en dernier par outils/missions.html et outils/boss.html (après mers.js et missions.js ou boss.js).
// - Progression sous la clé de test « souquez.proto.carte » (la même que outils/carte-mer.html). koa.save n'est jamais écrit.
// - Ordres appris : seuls les ordres appris jusqu'à cette mission comprise sont reconnus (le boss : tous ceux de la mer).
// - Écran de fin : étoiles, butin gagné, pièce rare (boss, 1re victoire), retour à la carte.
//   0 étoile (coque cédée) : « Rejouer » en premier et sélectionné, butin gardé à ×1.
'use strict';
const BOUCLE = (() => {
  const CLE = 'souquez.proto.carte';
  const MER = MERS[0];
  const ID = typeof MISSION !== 'undefined' ? MISSION.id : 'boss';
  const M = MER.missions.find((m) => m.id === ID), IDX = MER.missions.indexOf(M);
  // Butin selon les étoiles (proposition de la Programmation, à confirmer par le GD) : 0 ou 1 ★ ×1, 2 ★ ×1,5, 3 ★ ×2
  const MULT = [1, 1, 1.5, 2];
  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (_) { return {}; } };
  const ecrire = (p) => { try { localStorage.setItem(CLE, JSON.stringify(p)); } catch (_) {} };

  // Langue passée par la carte (?lang=en), sans rien écrire dans la sauvegarde du jeu
  const q = new URLSearchParams(location.search);
  if (q.get('lang') === 'en' || q.get('lang') === 'fr') { save.lang = q.get('lang'); applyTexts(); }
  const L = () => (save.lang === 'en' ? 'en' : 'fr');
  const carteUrl = () => 'outils/carte-mer.html?lang=' + L();
  const TX = {
    fr: { carte: '← Carte', retourCarte: 'Retour à la carte', gagne: 'Mission réussie !', gagneTxt: 'L’équipage a tenu bon. Cap sur la suite !',
      bossGagne: 'Tonton Homard est vaincu !', bossTxt: 'Il lâche une plaque gravée en s’enfuyant…', bossEtoile: 'Tonton Homard vaincu',
      cede: 'La coque a cédé', cedeTxt: 'Pas d’étoile cette fois, mais ton butin est gardé. Rejoue pour décrocher les étoiles.',
      butin: (n, x) => 'Butin : +' + n + ' ⚙ (×' + String(x).replace('.', ',') + ')', piece: 'Pièce de navire rare trouvée !', ordre: (o) => 'Nouvel ordre appris : ' + o,
      ferme: 'Cette mission est encore verrouillée : retour à la carte.' },
    en: { carte: '← Map', retourCarte: 'Back to the map', gagne: 'Mission complete!', gagneTxt: 'The crew held firm. On to the next one!',
      bossGagne: 'Uncle Lobster is beaten!', bossTxt: 'He drops an engraved plate as he flees…', bossEtoile: 'Uncle Lobster beaten',
      cede: 'The hull gave way', cedeTxt: 'No star this time, but your loot is kept. Play again to earn the stars.',
      butin: (n, x) => 'Loot: +' + n + ' ⚙ (×' + x + ')', piece: 'Rare ship part found!', ordre: (o) => 'New order learnt: ' + o,
      ferme: 'This mission is still locked: back to the map.' },
  };
  const tx = (k) => TX[L()][k];

  // Mission encore verrouillée (lien direct) : retour à la carte
  const ouverte = (i) => i === 0 || ((lire()[MER.missions[i - 1].id] || {}).etoiles || 0) >= 1;
  if (IDX > 0 && !ouverte(IDX)) { alertTitre(tx('ferme')); }
  function alertTitre(msg) { const p = document.querySelector('#ovTitle p'); if (p) p.textContent = msg; $('playBtn').onclick = () => { location.href = carteUrl(); }; }

  // Ordres appris jusqu'à cette mission comprise ; les autres ne sont plus reconnus ni montrés dans le carnet
  const appris = new Set(MER.missions.slice(0, IDX + 1).flatMap((m) => m.ordre || []));
  if (M.boss) for (const m of MER.missions) for (const o of m.ordre || []) appris.add(o);
  for (const id of Object.keys(COMMANDS)) if (!appris.has(id)) delete COMMANDS[id];
  buildBook();
  const _hint = commandHint;
  commandHint = function () {
    const foe = aliveEnemy();
    if (COMMANDS.DEF && G.mons.some((e) => e.hp > 0 && e.tele && e.dmg >= WARN_DMG)) return seqTxt('DEF');
    if (COMMANDS.HEAL && G.ship.hp <= SHIP.hull * 0.4) return seqTxt('HEAL');
    return foe && foe.x - G.ship.x <= RANGE ? seqTxt('ATK') : seqTxt('ADV');
  };

  // Écran titre : bouton de retour à la carte
  const b = document.createElement('button'); b.className = 'btn alt'; b.textContent = tx('carte');
  b.onclick = () => { location.href = carteUrl(); };
  $('playBtn').after(b);
  // Le boss : l'étoile du but dit « Tonton Homard vaincu »
  if (M.boss) { STR.fr.starPort = TX.fr.bossEtoile; STR.en.starPort = TX.en.bossEtoile; document.querySelector('#ovTitle p').textContent = M.nom[L()] + ' · ' + M.bpm + ' BPM'; }

  // Le premier bouton de l'écran de fin prend le focus à son ouverture (après la scène de la plaque pour le boss)
  let focusFin = null;
  const _open = openOverlay;
  openOverlay = function (id) { _open.apply(this, arguments); if (id === 'ovWin' && focusFin) focusFin.focus(); };
  // Fin de mission : progression, butin, ordre appris, boutons
  const _winGame = winGame;
  winGame = function () {
    _winGame.apply(this, arguments);
    const r = G.result, et = r.stars, p = lire(), avant = p[ID] || {};
    const x = MULT[et], gain = Math.round(M.butin * x);
    const piece = M.piece && et >= 1 && !p._piece;
    p[ID] = { etoiles: Math.max(avant.etoiles || 0, et), temps: et >= 1 ? Math.min(avant.temps ?? Infinity, Math.round(r.time)) : avant.temps, coque: et >= 1 ? Math.max(avant.coque ?? 0, Math.floor(G.ship.hp)) : avant.coque };
    if (p[ID].temps === Infinity) delete p[ID].temps;
    p._butin = (p._butin || 0) + gain;
    if (piece) p._piece = true;
    ecrire(p);
    // Textes
    const ov = $('ovWin');
    ov.querySelector('h2').textContent = et === 0 ? tx('cede') : M.boss ? tx('bossGagne') : tx('gagne');
    ov.querySelector('p').textContent = et === 0 ? tx('cedeTxt') : M.boss ? tx('bossTxt') : tx('gagneTxt');
    const lignes = [tx('butin')(gain, x)];
    if (piece) lignes.push(tx('piece'));
    if (et >= 1 && !M.boss) for (const o of M.ordre || []) lignes.push(tx('ordre')(t('cmd' + o)));
    $('starsWhy').insertAdjacentHTML('beforeend', lignes.map((s) => '<span class="ok"><b>⚓</b>' + s + '</span>').join(''));
    // Boutons : 0 étoile → « Rejouer » d'abord ; sinon « Retour à la carte » d'abord
    const again = $('againBtn'), carte = $('titleBtn2'), row = again.parentNode;
    carte.textContent = tx('retourCarte'); carte.onclick = () => { location.href = carteUrl(); };
    if (et === 0) row.prepend(again); else row.prepend(carte);
    const premier = row.firstElementChild; premier.classList.remove('alt'); premier.nextElementSibling.classList.add('alt');
    focusFin = premier; if (!ov.hidden) premier.focus();
  };
  return { CLE, ID, appris };
})();
