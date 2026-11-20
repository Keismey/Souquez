// Souquez ! : monstres canvas de la DA (outils/proto/monstres.js, copie exacte) branchés sur les prototypes hors du jeu
// (outils/missions.html et outils/boss.html). Chargé après les scripts du jeu et boss.js. Le jeu lui-même n'est pas modifié.
// Correspondance : sardine → sardine, crache → cracheur, cogneur → bernard, homard → homard.
// Tailles de la DA (px à côté d'un navire de 750 px, Pépin 35 px), ramenées à l'échelle du Pépin du jeu (PEPIN_H unités).
// États : prepare = e.raise, touche = e.shake, coule = 1 - e.fade, attaque = 0 → 1 sur un temps quand le coup part.
'use strict';
(function () {
  if (typeof MONSTRES === 'undefined') return;
  const NOM = { sardine: 'sardine', crache: 'cracheur', cogneur: 'bernard', homard: 'homard' };
  const TAILLE = { sardine: 50, cracheur: 60, bernard: 75, homard: 190 }, PEPIN_PX = 35;
  const now = () => performance.now() / 1000;
  const since = (t0) => (t0 == null ? 1 : Math.min(1, (now() - t0) / SPB));
  // Le coup part quand l'annonce retombe alors que le monstre est vivant (boucle générique du jeu)
  const _update = update;
  update = function (dt) {
    _update(dt);
    if (G) for (const e of G.mons) { if (e._tele && !e.tele && e.hp > 0 && e.type !== 'homard') e._atk = now(); e._tele = e.tele; }
  };
  // Tonton Homard : ses coups passent par pince() (boss.js) ; le 2e coup de la double pince anime l'autre pince
  if (typeof pince === 'function') {
    const _pince = pince;
    pince = function (h) { if (h._double) { h._atk2 = now(); h._double = false; } else { h._atk = now(); h._double = !!(B && B.dbl); } return _pince.apply(this, arguments); };
  }
  const _draw = drawMonster;
  drawMonster = function (e) {
    const nom = NOM[e.type]; if (!nom) return _draw(e);
    if (e.fade <= 0) return;
    const h = TAILLE[nom] * (typeof PEPIN_H !== 'undefined' ? PEPIN_H : 20.9) / PEPIN_PX;
    const etat = { prepare: e.raise, attaque: since(e._atk) < 1 ? since(e._atk) : 0, touche: Math.min(1, e.shake), coule: 1 - e.fade };
    if (e.type === 'homard' && typeof B !== 'undefined' && B) {
      etat.double = B.phase === 3 ? 1 : 0; etat.attaque2 = since(e._atk2) < 1 ? since(e._atk2) : 0; etat.colere = B.phase === 3 ? 1 : 0;
      // Jet de vapeur (phase 2) : environ 1,5 temps à partir du tir
      for (const sh of G.shots) if (sh.spit && sh.mon && !sh._vu && sh.x0 > G.ship.x + 200) { sh._vu = true; e._jet = now(); }
      const kj = e._jet == null ? 1 : (now() - e._jet) / (1.5 * SPB); etat.jet = kj < 1 ? kj : 0;
      if (etat.double && e.tele) etat.prepare = 1; // entre les 2 coups de la double pince, la 2e reste levée
      // Double pince à 2 temps (DA) : la 1re reste baissée, la 2e s'arme (arme2) puis frappe (attaque2)
      const c = e._atk == null ? 99 : (now() - e._atk) / SPB;
      if (etat.double && c < BOSS.ecart + 1) {
        etat.prepare = 1; etat.attaque = Math.min(1, c);
        const c2 = e._atk2 != null && e._atk2 >= e._atk ? (now() - e._atk2) / SPB : -1;
        etat.arme2 = c2 >= 0 ? 1 : Math.max(0, Math.min(1, c - (BOSS.ecart - 1))); etat.attaque2 = c2 >= 0 && c2 < 1 ? c2 : 0;
      }
    }
    MONSTRES.draw(cx, nom, e.x, SEA + 8, h, tAmb, -1, e.x * 0.01, etat);
    // Points de vie au-dessus de la tête (comme dans le jeu)
    if (e.hp > 0) {
      cx.save(); cx.globalAlpha = e.fade; const y = SEA + 8 - h - 10, w = e.max > 12 ? 4 : 10;
      if (e.type === 'homard') { // barre de vie avec les seuils des phases (25 et 12)
        const bw = h * 0.7; C('rgba(0,0,0,.45)'); cx.fillRect(e.x - bw / 2, y - 4, bw, 7); C('#ffd447'); cx.fillRect(e.x - bw / 2, y - 4, bw * Math.max(0, e.hp) / e.max, 7);
        C('#1F2A44'); for (const s of [25, 12]) cx.fillRect(e.x - bw / 2 + bw * s / e.max - 1, y - 6, 2, 11);
      } else for (let i = 0; i < e.max; i++) { C(i < e.hp ? '#ffd447' : 'rgba(0,0,0,.4)'); cx.beginPath(); cx.arc(e.x - (e.max - 1) * w / 2 + i * w, y, e.max > 12 ? 1.8 : 3.5, 0, 7); cx.fill(); }
      cx.restore();
    }
  };
})();
