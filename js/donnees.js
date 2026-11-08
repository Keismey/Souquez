// Souquez ! : données de jeu (aucune logique ici). Les scripts partagent la portée globale, chargés dans l'ordre de index.html.
'use strict';
const VERSION = '0.12.0';
const GAME_NAME = 'Souquez !';
const SAVE_KEY = 'koa.save';

// ---------- Données de jeu ----------
const PADS = { BOUM: '#e0613d', TAK: '#e8a33a', DING: '#33a7c8', CHH: '#86b83f' };
const COMMANDS = {
  // Chaque ordre commence à droite, sur BOUM
  ADV:  { seq: ['BOUM', 'TAK', 'BOUM', 'TAK'] },
  ATK:  { seq: ['BOUM', 'BOUM', 'TAK', 'TAK'] },
  // DING est rare : il ne sert qu'à conclure les ordres de soutien
  DEF:  { seq: ['BOUM', 'BOUM', 'BOUM', 'DING'] },
  HEAL: { seq: ['BOUM', 'BOUM', 'TAK', 'DING'] },
};
// 3 tambours au départ (TAK + DING à gauche, BOUM seul à droite et le plus utilisé) ; CHH arrivera avec les ordres secondaires
const PADS_ON = ['BOUM', 'DING', 'TAK'];
// Tempo : 102 BPM (calé sur la musique) ; le boss joue plus vite (Tonton Homard 106). setTempo() le change avant une partie.
const BPM_BASE = 102;
let BPM = BPM_BASE, SPB = 60 / BPM;
function setTempo(bpm) { BPM = bpm || BPM_BASE; SPB = 60 / BPM; }
const WIN = { p: 0.08, g: 0.16 };
// Monde en unités « écran de 400 de haut ». La mer est à SEA.
// STOP : le navire s'arrête à cette distance du monstre ; RANGE : portée des canons du navire.
const SEA = 228, STOP = 250, RANGE = 470;

// ---------- Équilibrage V1 (GDD, validé le 8 nov. 2026) ----------
// Un « cycle » = une commande de 4 temps + la réponse de l'équipage (4 temps).
const SHIP = {
  hull: 20,          // points de coque
  advance: 45,       // unités par temps de réponse (× 4 = 180 par cycle)
  shot: 1,           // dégâts d'un tir (2 tirs par cycle)
  perfectBonus: 1,   // +1 au 2e tir si la commande est jouée au moins à 75 % en Parfait
  guard: 0.25,       // Protéger : dégâts reçus × 0,25
  heal: 1.5,         // Soigner : 2 fois par cycle (+3 par cycle)
};
// Pleine puissance : 4 crans, +1 par commande réussie. Une erreur (fausse note, note oubliée, rythme cassé)
// coûte « penalty » crans. Décision du 8 nov. : option A (−2) par défaut ; option B (0 = retour à zéro)
// réservée plus tard à un mode difficile ou aux dernières mers (le Game design dira où).
// Ordre de priorité : ?penalite=N dans l'adresse (tests) > penalty de la mission (LEVEL) > mode (MODES) > POWER.penalty.
// advMult : en pleine puissance, Avancer va 1,5 fois plus loin (essai du 8 nov.).
const POWER = { steps: 4, mult: 1.5, advMult: 1.5, penalty: 2 };
const MODES = { normal: { penalty: 2 }, difficile: { penalty: 0 } };
let MODE = 'normal'; // pas encore de choix de mode dans le jeu
let PENALTY_URL = null;
try { const q = new URLSearchParams(location.search).get('penalite'); if (q !== null && /^\d+$/.test(q)) PENALTY_URL = +q; } catch (_) {}
function penaltyNow() {
  if (PENALTY_URL !== null) return PENALTY_URL;
  if (LEVEL.penalty != null) return LEVEL.penalty;
  const m = MODES[MODE]; return m && m.penalty != null ? m.penalty : POWER.penalty;
}
// Conseil « protège-toi » : seulement avant un coup d'au moins WARN_DMG dégâts (le Cogneur).
const WARN_DMG = 3;
// Monstres : attaque annoncée 6 temps avant (TELE), première attaque FIRST temps après être à portée.
const TELE = 6, FIRST = 10;
const MONSTERS = {
  sardine:  { hp: 6,  dmg: 2, every: 16, reach: 300, size: 1,   color: '#5b7680', shotDur: 0.42 }, // au contact
  crache:   { hp: 5,  dmg: 1, every: 12, reach: 760, size: 0.9, color: '#7a6a52', shotDur: 0.7, spitter: true }, // de loin
  cogneur:  { hp: 12, dmg: 4, every: 24, reach: 540, size: 1.7, color: '#5d6670', shotDur: 0.5, boss: true },
  // Tonton Homard (Léviathan de la mer 1) : ses attaques sont gérées par js/boss.js (portée négative = jamais dans la boucle générique)
  homard:   { hp: 40, dmg: 6, every: 24, reach: -1e9, size: 1.5, color: '#b5452f', shotDur: 0.5, boss: true },
};
// Tonton Homard (GDD « Mer 1 en détail ») : pince 6 dégâts tous les 24 temps, annoncée 10 temps avant, 1er coup au temps 28 ;
// phase 2 (≤ 25 PV) : 2 Sardines appelées une fois + jet de vapeur 1 dégât tous les 12 temps ; phase 3 (≤ 12 PV) : double pince 2 × 5, 4 temps d'écart.
const BOSS = { tele: 10, every: 24, pince: 6, double: 5, ecart: 4, jet: 1, jetEvery: 12, premier: 28, zoom: 0.84, phase2: 25, phase3: 12 };
// Mission en cours : remplie par chargerMission() (js/mer.js) depuis MERS. Valeurs par défaut = mission V1 (« Cap au large »).
const LEVEL = {
  portX: 3000,
  penalty: null, // null = suit le mode ; 0 à 4 pour imposer une pénalité à cette mission
  monsters: [
    { type: 'sardine', x: 800 },
    { type: 'crache', x: 1350 }, { type: 'crache', x: 1440 },
    { type: 'sardine', x: 1950 },
    { type: 'cogneur', x: 2500 },
  ],
};
// Étoiles : 1 = arriver au port ; +1 si coque ≥ 50 % ; +1 si fini en STARS.refTime secondes ou moins. Coque cédée = 0 étoile.
const STARS = { hullRatio: 0.5, refTime: 140 }; // 2 min 20 (essai du 8 nov., avant : 165)
const CAL_END = 16; // 4 temps de décompte + 12 temps de calibrage

// Mers et missions (validé par le Game design ; positions sur la carte en % de la carte).
// Par mission : but (bouée, phare, épave, port), portX, rencontres [type, x] ou 'V1', temps de référence (s), butin de base,
// ordres appris dans cette mission. Le boss : combat sur place, tempo propre, pièce de navire rare à la 1re victoire.
const MERS = [
  {
    id: 'mer1', nom: { fr: 'Mer 1 : les Hauts-Fonds', en: 'Sea 1: the Shallows' },
    missions: [
      { id: 'm1', nom: { fr: 'Larguer les amarres', en: 'Cast Off' }, but: 'bouee', portX: 2000, ref: 75, rencontres: [['sardine', 700], ['sardine', 1300]], butin: 20, ordre: ['ADV', 'ATK'], carte: [11, 64] },
      { id: 'm2', nom: { fr: 'Sous la mitraille', en: 'Under Fire' }, but: 'phare', portX: 2600, rencontres: [['sardine', 700], ['crache', 1300], ['sardine', 1700], ['crache', 2000], ['crache', 2080]], ref: 110, butin: 30, ordre: ['HEAL'], carte: [31, 28] },
      { id: 'm3', nom: { fr: 'L’enclume', en: 'The Anvil' }, but: 'epave', portX: 2600, rencontres: [['sardine', 700], ['crache', 1250], ['cogneur', 2000]], ref: 110, butin: 30, ordre: ['DEF'], carte: [51, 62] },
      { id: 'm4', nom: { fr: 'Cap au large', en: 'Out to Sea' }, but: 'port', portX: 3000, rencontres: 'V1', ref: 140, butin: 40, ordre: [], carte: [70, 26] },
      { id: 'boss', nom: { fr: 'Tonton Homard', en: 'Uncle Lobster' }, boss: true, bpm: 106, ref: 105, butin: 60, piece: true, ordre: [], carte: [88, 52] },
    ],
  },
];
// Butin selon les étoiles (règle validée) : 0 ou 1 ★ ×1, 2 ★ ×1,5, 3 ★ ×2.
const BUTIN_MULT = [1, 1, 1.5, 2];

// Musique : boucle de 32 mesures à 102 BPM ; le premier temps tombe à MUS_OFF secondes dans le fichier.
const MUS_URL = 'koa-music.mp3', MUS_OFF = 0.066, MUS_BEATS = 128;
