# Plan de test : 0.12.0 (mer 1 dans le jeu + passe de qualité)

But : la boucle de la mer 1, jusqu'ici dans `outils/` (carte → mission ou boss → écran de fin → carte), entre dans le vrai jeu, avec le navire v3, l'équipage de la DA et les monstres en canvas. On vérifie que tout se joue, que la progression est sauvegardée, et que rien de la 0.11.2 ne casse.
Testeur : PC 1280×720 (clavier J/F/D + souris), mobile simulé 863×360 et 412 px de haut, tactile. Directeur : séance G85 en fin de fichier.
Noter ✅ / ❌ / ⚠️, capture pour chaque ❌, sévérité proposée (🔴 🟠 ⚪).

## A. Sauvegarde (🔴 si ça casse)
1. Mise à jour depuis une sauvegarde 0.11.2 (latence, réglages, étoiles) : tout est gardé, pas de nouveau calibrage.
2. La progression de la mer 1 est enregistrée dans la sauvegarde du jeu (pas sous la clé de test `souquez.proto.carte`). Fermer, relancer : étoiles, butin, meilleurs temps et pièce rare sont toujours là.
3. Sauvegarde corrompue ou vide (effacer `localStorage`) : le jeu démarre en nouveau joueur, sans écran blanc.
4. Export puis import de la sauvegarde (Options) : la progression revient à l'identique.

## B. Carte de la mer 1
5. Nouveau joueur : mission 1 ouverte et mise en avant, les autres et le boss verrouillés. Toucher une bouée verrouillée n'ouvre rien.
6. Fiches : objectif bouée / phare / épave / port, temps de référence, butin de base, ordre appris ; fiche du boss avec la pièce rare. FR et EN. *(Revérifie les bugs 18 à 20.)*
7. Clavier : Tab reste dans la fiche, Échap la ferme et rend le focus à la bouée.
8. Total des étoiles sur 15, juste après chaque mission.

## C. Missions 1 à 4
9. Chaque mission se joue jusqu'au bout ; seuls les ordres appris jusque-là sont reconnus (Soigner dès m2, Protéger dès m3).
10. Écran de fin : étoiles, butin × 1 / × 1 / × 1,5 / × 2 selon 0 à 3 étoiles, ordre appris, « Retour à la carte ».
11. Coque cédée en route puis arrivée au port : **1 étoile** (ni coque ni temps), butin × 1, mission suivante **ouverte**, meilleur temps et meilleure coque **non enregistrés** (bug 24). Abandon avant le port : rien ne se débloque. Boss : coque cédée = le combat se relance.
12. Le déblocage suit les étoiles : 1 étoile ouvre la mission suivante, 4 missions faites ouvrent le boss.

## D. Boss : Tonton Homard
13. Le combat passe à **106 BPM** : la musique, le métronome et les notes Parfait/Bien suivent le nouveau tempo, avec la même latence calibrée.
14. Les 3 phases s'enchaînent ; le dézoom ne fait sortir ni le navire ni le boss de l'écran (863×360 compris).
15. Chaque coup est annoncé puis marque une pause avant de tomber ; la double pince frappe 2 fois à 2 temps d'écart ; Protéger réduit les deux.
16. Victoire : pièce rare la première fois seulement ; une 2e victoire ne la redonne pas.

## E. Navire v3, équipage, monstres
17. Les 5 personnages à leur poste : pieds sur le plancher, mains sous le plafond en panique, matelots visibles à côté des canons. *(Revérifie les bugs 21 et 22.)*
18. Les monstres canvas (Sardine, Crache-Boulons, Bernard) s'affichent, s'animent et disparaissent proprement ; badge hors écran toujours juste.
19. La coque montre ses dégâts (80 % / 45 % / 20 %), plaque au-dessus de la mer (bug 23).

## F. Passe de qualité et régression
20. Options : volumes musique et Bruitages, vibrations, langue, gaucher, notes de MAJ, sauvegarde, bug, soutien, crédits ; tout est traduit, boutons ≥ 48 px.
21. Pause pendant une mission et pendant le boss : décompte de 4 temps, aucun cran perdu.
22. Scènes de dialogue : jouées une fois, bouton Passer, rien ne s'affiche par-dessus une autre fenêtre.
23. Hors ligne : la carte, les 4 missions et le boss s'ouvrent (nouveaux fichiers bien dans le cache, nom du cache changé).
24. Nouvelle version qui arrive en pleine mission : pas de rechargement avant le retour à la carte ou au titre.
25. Console (F12) : aucune erreur, du titre jusqu'à la victoire contre le boss.

---

## Séance G85 du directeur (10 minutes)
À faire en une fois, son allumé, vibrations activées, appli installée.
1. **(1 min)** Ouvre l'appli : tes réglages et ta latence sont toujours là.
2. **(3 min)** Joue la mission 1 en entier. Le tambour tombe-t-il pile avec la musique et avec les frappes de l'équipage ? Ça vibre à chaque frappe ?
3. **(1 min)** Pendant une attaque, avec plusieurs monstres et tout l'équipage qui panique : ça reste fluide, sans saccade ?
4. **(1 min)** Appuie sur pause, puis reprends : le décompte est-il clair à l'oreille ?
5. **(3 min)** Lance le boss (débloqué pour le test si besoin) : à 106 BPM, tes frappes sont-elles toujours « Parfait » ou « Bien » sans recalibrer ?
6. **(1 min)** Le son global : la musique, les voix et les bruitages s'entendent-ils bien tous les trois ?
Réponds simplement « ok » ou décris ce qui cloche, point par point.
