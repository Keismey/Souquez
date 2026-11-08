# Plan de test : Pépin dessiné en code dans le jeu (0.11.0)

But : Pépin (dessin canvas de la DA, `js/equipage.js`) remplace le premier matelot de l'équipage. Il doit bien bouger, tenir sous les ponts, rester fluide sur mobile, et ne rien casser d'autre.
Appareils : PC 1280×720 (clavier J/F/D), mobile paysage 863×360 et 412 px de haut, et **G85** pour les performances (directeur).
Noter ✅ / ❌ / ⚠️ ; capture pour chaque ❌.

## A. Les 4 états en partie
1. **Repos** : Pépin est à son poste, immobile mais vivant (respiration, léger balancement), pieds posés sur le pont.
2. **Course** : quand l'équipage change de poste (ordre Avancer, Attaquer, Protéger, Soigner), Pépin court jusqu'à sa nouvelle place, jambes et bras animés, puis repasse en repos à l'arrivée.
3. **Panique** : pendant l'alerte (attaque annoncée de Bernard-l'Enclume, Crache-Boulons), Pépin passe en panique, mains levées.
4. **Tambour** : ⚠️ dans le code 0.11.0, le jeu n'envoie que repos / course / panique ; l'état « tambour » n'est jamais demandé. Vérifier s'il apparaît quelque part ; sinon le signaler à la Programmation (oubli ou choix voulu ?).
5. Passage d'un état à l'autre sans saut ni image vide (pas de clignotement, pas de membre qui se téléporte).

## B. Place sous les plafonds
6. En **panique**, les mains levées ne traversent pas le plafond du pont, sur chaque poste où Pépin peut se trouver.
7. Pépin a toujours les pieds sur le plancher du pont, quelle que soit la taille d'écran (863×360, 412 de haut, 720 de haut).
8. Le navire tangue et prend des coups : Pépin reste collé à son pont (pas de décalage, pas de flottement).
9. Pépin reste lisible à sa taille réelle (environ 40 px sur 720 de haut, la charte prévoit 60 px plus tard) : on reconnaît le bonnet et la bouée.

## C. Sens de la course
10. Pépin regarde vers l'endroit où il court : vers la droite quand il va à droite, vers la gauche quand il va à gauche (y compris retour à son poste).
11. À l'arrivée, il ne se retourne pas en boucle ni ne tremble entre droite et gauche.

## D. Performances sur mobile
12. Mobile simulé : fluidité pendant une partie complète, surtout pendant une panique avec tout l'équipage en mouvement. Comparer avec la 0.10.4 (images/s si mesurable).
13. **G85 (directeur)** : la partie reste fluide, aucune saccade quand Pépin court ou panique, le rythme n'est pas décalé.
14. Pause puis reprise : Pépin reprend son animation là où elle était (le dessin dépend seulement du temps).

## E. Pas de régression
15. Mise à jour depuis la 0.10.4 : réglages, latence et étoiles conservés ; la nouvelle version arrive en un rechargement.
16. Hors ligne : le jeu s'ouvre et Pépin s'affiche (`js/equipage.js` est bien dans le cache).
17. Les autres matelots, le navire, les monstres, les scènes et les badges hors écran s'affichent comme en 0.10.4.
18. Une partie complète jusqu'au port : rythme, 4 ordres, pleine puissance et étoiles comme avant.
19. Console (F12) : aucune erreur pendant une partie, ni au chargement.
