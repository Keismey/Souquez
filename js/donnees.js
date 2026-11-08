// Souquez ! : données de jeu (aucune logique ici). Les scripts partagent la portée globale, chargés dans l'ordre de index.html.
'use strict';
const VERSION = '0.7.5';
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
const SEA = 228, STOP = 250, RANGE = 470, AGGRO = 540;
const LEVEL = {
  monsters: [{ x: 900, hp: 4, size: 1 }, { x: 1550, hp: 6, size: 1.2 }, { x: 2300, hp: 10, size: 1.7, boss: true }],
  portX: 2950, hull: 10,
};
const CAL_END = 16; // 4 temps de décompte + 12 temps de calibrage

// Musique : boucle de 32 mesures à 102 BPM ; le premier temps tombe à MUS_OFF secondes dans le fichier.
const MUS_URL = 'koa-music.mp3', MUS_OFF = 0.066, MUS_BEATS = 128;
