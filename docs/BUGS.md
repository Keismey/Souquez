# Souquez ! — Liste des bugs

Tenue par le fil QA. Le directeur signale les bugs dans le fil Directeur, qui les transmet ; le fil QA les note ici et suit leur statut.

**Gravité** : 🔴 bloquant (crash, rythme désynchronisé, sauvegarde perdue : la version ne sort pas) · 🟠 gênant · ⚪ détail
**Statut** : ouvert · en cours · corrigé (à revérifier) · vérifié · refusé

| N° | Gravité | Version | Description | Fil chargé | Statut |
|----|---------|---------|-------------|------------|--------|
| 1 | 🟠 | 0.8.1 | Fausse note au milieu d'un ordre (ex. BOUM BOUM DING TAK) : la pleine puissance perd 2 crans au lieu d'1 (la note suivante ouvre un nouvel ordre, raté aussi). | Programmation | ouvert |
| 2 | 🟠 | 0.8.1 | La pause (bouton ou appli quittée) ne fait perdre aucun cran ; la règle validée dit 1 cran. Plan ou code à corriger : au directeur de trancher. | Directeur → Programmation | ouvert |
| 3 | 🟠 | 0.8.1 | Le conseil « protège-toi » revient tous les 6 temps face aux 2 Crache-Boulons : un joueur qui obéit protège sans fin et n'attaque jamais. | Game design → Programmation | ouvert |
| 4 | ⚪ | 0.8.1 | Écran de victoire à 2 étoiles : ne dit pas quelle étoile manque (coque non affichée). | Programmation | vérifié (0.8.2) |
| 5 | ⚪ | 0.8.1 | Texte de victoire « Le fort ennemi est tombé » : reste de l'ancien thème. | Narration | vérifié (0.8.2) |
| 6 | ⚪ | 0.8.2 | Écran de 360 px de haut : le bouton « Écran titre » de la victoire sort de l'écran (atteignable en faisant défiler). | Programmation | ouvert |

## Versions validées

| Version | Date | Testée sur | Plan de test | Résultat |
|---------|------|------------|--------------|----------|
| 0.7.6 (code découpé + outils du hub) | 2026-11-08 | G85 + PC | PLAN-TEST-decoupage.md | ✅ validée par le directeur, aucun bug |
| 0.8.1 (équilibrage V1) | 2026-11-08 | Testeur auto (PC + mobile simulé) | PLAN-TEST-V1.md | ⏳ bugs 1 à 5 ouverts ; reste à faire par le directeur sur G85 : son, vibration, calage à l'oreille, ressenti (18-19). Rapport : RAPPORT-TEST-V1-0.8.1.md |
