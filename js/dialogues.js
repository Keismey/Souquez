// Souquez ! : dialogues de l'histoire, FR / EN (fichier de la Narration).
// Chaque scène est une liste de bulles { qui, fr, en }. qui = clé de PERSONNAGES,
// ou 'scene' pour une didascalie (texte de mise en scène, sans bulle de personnage).
// Bulles : 10 mots maximum. Mer 1 validée le 2026-11-08.
'use strict';

const PERSONNAGES = {
  hortense: { fr: 'Hortense', en: 'Hortense' },   // la Bosco Hortense (Bosun Hortense), maîtresse d'équipage râleuse
  gaston:   { fr: 'Gaston',   en: 'Gaston' },     // Gaston Piston, mécanicien enthousiaste
  doc:      { fr: 'Doc',      en: 'Doc' },        // Doc Bouillon (Doc Broth), cuisinière-médecin
  pepin:    { fr: 'Pépin',    en: 'Pip' },        // mousse peureux, parle de lui à la 3e personne
  vieux:    { fr: 'Le Vieux', en: 'The Old Man' } // l'ancien capitaine
};

const DIALOGUES = {
  // Mer 1, avant le tuto Avancer
  mer1_intro: [
    { qui: 'scene',    fr: "Port de la Baie des Bigorneaux, à l'aube.", en: 'Periwinkle Bay harbour, at dawn.' },
    { qui: 'pepin',    fr: "Pépin a vu un truc dans l'eau. Un gros truc.", en: 'Pip saw something in the water. A big something.' },
    { qui: 'hortense', fr: 'Encore une baleine. Retourne frotter le pont.', en: 'Another whale. Back to scrubbing.' },
    { qui: 'scene',    fr: 'BOUM ! Le quai tremble.', en: 'BOOM! The dock shakes.' },
    { qui: 'gaston',   fr: "C'est pas une baleine. Elle a des boulons !", en: "That's no whale. It has bolts!" },
    { qui: 'doc',      fr: 'Le Vieux est touché ! Faites de la place !', en: "The Old Man's hurt! Make room!" },
    { qui: 'vieux',    fr: 'Je ne tiendrai plus la baguette. Prends-la.', en: "I can't hold the drumstick anymore. Take it." },
    { qui: 'vieux',    fr: 'Bats, Capitaine. Ils comprendront.', en: "Drum, Captain. They'll understand." },
    { qui: 'hortense', fr: 'Un nouveau capitaine. En pleine attaque. Évidemment.', en: 'A new captain. Mid-attack. Of course.' },
    { qui: 'gaston',   fr: 'Chaudières chaudes ! On attend vos ordres, Capitaine !', en: 'Boilers hot! Awaiting orders, Captain!' },
    { qui: 'pepin',    fr: 'Pépin espère que le Capitaine connaît le rythme.', en: 'Pip hopes the Captain knows the beat.' },
    { qui: 'hortense', fr: 'BOUM, TAK, BOUM, TAK. On avance. Simple.', en: 'BOOM, TAK, BOOM, TAK. We move. Simple.' }
  ],
  // Mer 1, avant le tuto Attaquer (premier monstre en vue)
  mer1_attaque: [
    { qui: 'pepin',    fr: "Le truc à boulons revient ! Pépin l'avait dit !", en: "The bolty thing's back! Pip said so!" },
    { qui: 'hortense', fr: 'BOUM BOUM, TAK TAK. Et on cogne.', en: 'BOOM BOOM, TAK TAK. And we hit.' },
    { qui: 'gaston',   fr: 'Regardez ses nageoires à hélice ! Magnifique !', en: 'Look at its propeller fins! Gorgeous!' },
    { qui: 'doc',      fr: 'Admire moins, vise mieux.', en: 'Admire less, aim better.' }
  ],
  // Mer 1, après la victoire du tuto Attaquer
  mer1_plaque: [
    { qui: 'gaston',   fr: 'Il a laissé ça. Une plaque gravée.', en: 'It left this. An engraved plate.' },
    { qui: 'vieux',    fr: "Ce symbole… Je l'ai déjà vu. Au large.", en: "That symbol… I've seen it before. Out at sea." },
    { qui: 'hortense', fr: 'Au large. Avec un capitaine tout neuf. Parfait.', en: 'Out at sea. With a brand-new captain. Perfect.' }
  ]
};
