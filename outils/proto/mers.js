// Souquez ! : données des mers et des missions (proposition du Game design, pas encore validée).
// Prototype hors du jeu ; repris dans js/donnees.js après validation.
// Par mission : id, nom FR/EN, but (bouée, phare, épave, port), portX, rencontres [type, x], temps de référence (s), butin de base, ordre appris, position sur la carte (x, y en % de la carte).
'use strict';
const MERS = [
  {
    id: 'mer1', nom: { fr: 'Mer 1 : les Hauts-Fonds', en: 'Sea 1: the Shallows' },
    missions: [
      { id: 'm1', nom: { fr: 'Larguer les amarres', en: 'Cast Off' }, but: 'bouee', portX: 2000, ref: 75, rencontres: [['sardine', 700], ['sardine', 1300]], butin: 20, ordre: ['ADV', 'ATK'], carte: [11, 64] },
      { id: 'm2', nom: { fr: 'Sous la mitraille', en: 'Under Fire' }, but: 'phare', portX: 2600, rencontres: [['sardine', 700], ['crache', 1300], ['sardine', 1700], ['crache', 2000], ['crache', 2080]], ref: 110, butin: 30, ordre: ['HEAL'], carte: [31, 28] },
      { id: 'm3', nom: { fr: 'L’enclume', en: 'The Anvil' }, but: 'epave', portX: 2600, rencontres: [['sardine', 700], ['crache', 1250], ['cogneur', 2000]], ref: 110, butin: 30, ordre: ['DEF'], carte: [51, 62] },
      { id: 'm4', nom: { fr: 'Cap au large', en: 'Out to Sea' }, but: 'port', portX: 3000, rencontres: 'V1', ref: 140, butin: 40, ordre: [], carte: [70, 26] },
      { id: 'boss', nom: { fr: 'Tonton Homard', en: 'Uncle Lobster' }, boss: true, bpm: 106, pv: 40, ref: 105, butin: 60, piece: true /* + une pièce de navire rare la première fois */, ordre: [], carte: [88, 52] },
    ],
  },
];
