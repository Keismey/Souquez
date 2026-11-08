# Souquez ! — Liste des bugs

Tenue par le fil QA. Le directeur signale les bugs dans le fil Directeur, qui les transmet ; le fil QA les note ici et suit leur statut.

**Gravité** : 🔴 bloquant (crash, rythme désynchronisé, sauvegarde perdue : la version ne sort pas) · 🟠 gênant · ⚪ détail
**Statut** : ouvert · en cours · corrigé (à revérifier) · vérifié · refusé

| N° | Gravité | Version | Description | Fil chargé | Statut |
|----|---------|---------|-------------|------------|--------|
| 1 | 🟠 | 0.8.1 | Fausse note au milieu d'un ordre (ex. BOUM BOUM DING TAK) : la pleine puissance perd 2 crans au lieu d'1 (la note suivante ouvre un nouvel ordre, raté aussi). | Programmation | vérifié (0.8.4) |
| 2 | 🟠 | 0.8.1 | La pause (bouton ou appli quittée) ne fait perdre aucun cran ; la règle validée dit 1 cran. Directeur : la pause devient gratuite (règle changée). | Directeur → Programmation | vérifié (0.8.4) |
| 3 | 🟠 | 0.8.1 | Le conseil « protège-toi » revient tous les 6 temps face aux 2 Crache-Boulons : un joueur qui obéit protège sans fin et n'attaque jamais. | Game design → Programmation | vérifié (0.8.4) |
| 4 | ⚪ | 0.8.1 | Écran de victoire à 2 étoiles : ne dit pas quelle étoile manque (coque non affichée). | Programmation | vérifié (0.8.2) |
| 5 | ⚪ | 0.8.1 | Texte de victoire « Le fort ennemi est tombé » : reste de l'ancien thème. | Narration | vérifié (0.8.2) |
| 6 | ⚪ | 0.8.2 | Écran de 360 px de haut : le bouton « Écran titre » de la victoire sort de l'écran (atteignable en faisant défiler). | Programmation | vérifié (0.8.3) |
| 7 | 🟠 | 0.9.0 | Après une scène ou une pause, le jeu repart en 0,6 s sans décompte ; une reprise en retard coûte la pénalité « rythme cassé » (−2 crans en sortant de la scène « attaque »). Contredit « pause gratuite ». | Programmation | vérifié (0.9.1) |
| 8 | ⚪ | 0.9.0 | Nouveau joueur : l'intro s'affiche par-dessus l'écran « Calibrage 12/12 ». | Programmation | vérifié (0.9.1) |
| 9 | 🟠 | 0.10.1 | Les Crache-Boulons attaquent depuis hors de l'écran (antérieur aux images). | Programmation | vérifié (0.10.2) |
| 10 | ⚪ | 0.10.0 | Le fond saute de 60 unités 2 fois par mission. | Programmation | vérifié (0.10.2) |
| 11 | ⚪ | 0.10.0 | La pose d'alerte des matelots n'est presque jamais visible. | Programmation / DA | vérifié (0.10.2) |
| 12 | ⚪ | 0.10.3 | En 863×360, le badge du 2e Crache-Boulons (hors écran) chevauche le 1er, en partie visible. Détail visuel, comportement correct (badge masqué pour un monstre visible depuis 0.10.3). | Programmation | vérifié (0.10.4) |
| 13 | 🟠 | 0.11.1 | Les coups de tambour de Pépin s'affichent 36 ms avant le son (horloge audio au lieu de `audibleAt`) ; écart plus grand sur téléphone. | Programmation | vérifié (0.11.2) |
| 14 | ⚪ | 0.11.1 | En panique, les mains de Pépin entrent dans le plancher au-dessus de la salle des machines (27,2 unités pour 24 de haut). | Programmation | vérifié (0.11.2) |
| 15 | ⚪ | 0.11.1 | La panique de Pépin suit chaque ordre, pas l'annonce d'attaque (écart avec le plan). Tranché : panique à l'annonce d'une attaque et quand la coque est touchée, pas après chaque ordre. | Programmation | vérifié (0.11.2) |
| 16 | ⚪ | 0.11.1 | Pépin se tourne vers la droite à l'arrivée, quel que soit le sens de sa course. | Programmation | vérifié (0.11.2) |
| 17 | ⚪ | 0.11.1 | Fluidité −12 % avec le processeur ralenti 6 fois : à confirmer sur le G85 par le directeur. | Directeur | à confirmer |
| 18 | 🟠 | carte mer 1 (3141c21) | Objectifs des missions tous « Atteindre la bouée » ; le Game design prévoit phare (m2), épave (m3), port (m4). | Programmation | ouvert |
| 19 | ⚪ | carte mer 1 (3141c21) | Fiche du boss : il manque « + une pièce de navire rare la première fois ». | Programmation | ouvert |
| 20 | ⚪ | carte mer 1 (3141c21) | Accessibilité : Tab sort de la fiche ouverte (aria-modal sans piège de focus). | Programmation | ouvert |

## Versions validées

| Version | Date | Testée sur | Plan de test | Résultat |
|---------|------|------------|--------------|----------|
| 0.7.6 (code découpé + outils du hub) | 2026-11-08 | G85 + PC | PLAN-TEST-decoupage.md | ✅ validée par le directeur, aucun bug |
| 0.8.1 (équilibrage V1) | 2026-11-08 | Testeur auto (PC + mobile simulé) | PLAN-TEST-V1.md | bugs 1 à 6 vérifiés corrigés en 0.8.2–0.8.4 ; reste à faire par le directeur sur G85 : son, vibration, calage à l'oreille, ressenti (18-19). Rapport : RAPPORT-TEST-V1-0.8.1.md |
