// Souquez ! : données de jeu (aucune logique ici). Les scripts partagent la portée globale, chargés dans l'ordre de index.html.
'use strict';
const VERSION = '0.8.1';
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
const BPM = 102, SPB = 60 / BPM; // calé sur la musique (102 BPM mesurés)
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
// Pleine puissance : 4 crans, +1 par commande réussie, −1 par commande ratée ou rythme cassé.
const POWER = { steps: 4, mult: 1.5 };
// Monstres : attaque annoncée 6 temps avant (TELE), première attaque FIRST temps après être à portée.
const TELE = 6, FIRST = 10;
const MONSTERS = {
  sardine:  { hp: 6,  dmg: 2, every: 16, reach: 300, size: 1,   color: '#5b7680', shotDur: 0.42 }, // au contact
  crache:   { hp: 5,  dmg: 1, every: 12, reach: 760, size: 0.9, color: '#7a6a52', shotDur: 0.7, spitter: true }, // de loin
  cogneur:  { hp: 12, dmg: 4, every: 24, reach: 540, size: 1.7, color: '#5d6670', shotDur: 0.5, boss: true },
};
// Mission V1 : port à 3 000 unités, 5 rencontres dans l'ordre.
const LEVEL = {
  portX: 3000,
  monsters: [
    { type: 'sardine', x: 800 },
    { type: 'crache', x: 1350 }, { type: 'crache', x: 1440 },
    { type: 'sardine', x: 1950 },
    { type: 'cogneur', x: 2500 },
  ],
};
// Étoiles : 1 = arriver au port ; +1 si coque ≥ 50 % ; +1 si fini en 2 min 45 ou moins. Coque cédée = 0 étoile.
const STARS = { hullRatio: 0.5, refTime: 165 };
const CAL_END = 16; // 4 temps de décompte + 12 temps de calibrage

// Musique : boucle de 32 mesures à 102 BPM ; le premier temps tombe à MUS_OFF secondes dans le fichier.
const MUS_URL = 'koa-music.mp3', MUS_OFF = 0.066, MUS_BEATS = 128;
