# Plan de test : V1 (équilibrage, pleine puissance, étoiles)

Référence : GDD, sections « Progression » et « Équilibrage V1 ». Chiffres de détail : `js/donnees.js` sur main.
Appareils : **G85** (tactile, paysage) et **PC** (clavier J/F/D). Chaque point sur les deux sauf mention contraire.
Noter ✅ / ❌ ; un ❌ se signale dans le fil Directeur. Avant de commencer : noter tes réglages et ta latence (Options).

## A. Pas de régression
1. Mise à jour depuis la 0.7.6 : réglages et latence conservés, pas de nouveau calibrage demandé.
2. Le rythme reste calé sur la musique toute la partie ; les 4 ordres marchent comme avant.

## B. Coque et monstres
3. La coque démarre à **20**.
4. **Sardine-à-Vapeur** (nageur) meurt en **6** points de dégâts (sans pleine puissance).
5. **Crache-Boulons** (cracheur) touche à distance et meurt en **5** points de dégâts.
6. **Bernard-l'Enclume** (cogneur) a **12** PV ; son coup de **4** est annoncé à l'avance (signe visible ou sonore).
7. Protéger lancé juste après l'annonce bloque ou réduit le coup de Bernard ; sans Protéger, la coque perd 4.
8. Soigner remonte la coque, sans dépasser 20.

## C. Pleine puissance
9. Après **4 ordres réussis d'affilée**, la pleine puissance est visible (jauge pleine ou signe clair).
10. En pleine puissance, dégâts et soins sont **× 1,5** (exemple : Sardine tombe plus vite).
11. Un ordre raté fait **perdre un seul cran** (4 → 3), pas de retour à zéro.
12. Une pause (bouton ou quitter l'appli) fait aussi perdre un seul cran.

## D. Étoiles et butin
13. **3 étoiles** : arriver au port avec la coque ≥ 10 et en moins de 2 min 45. Le temps final est affiché.
14. **2 étoiles** : faire exprès d'arriver avec la coque à 9 ou moins (ou en plus de 2 min 45) : une étoile manque, laquelle est claire.
15. **Coque à 0** : pas d'écran de game over, 0 étoile, retour au port, le butin ramassé est gardé.
16. Butin : × 1 / × 1,5 / × 2 selon 1, 2 ou 3 étoiles, et bonus affiché la **première** fois qu'on gagne chaque étoile (pas la deuxième fois).
17. Étoiles et meilleur résultat restent après fermeture et relance ; avoir peu d'étoiles ne bloque jamais la mer suivante.

## E. Ressenti (à noter, pas ✅/❌)
18. Première partie sans t'entraîner : combien d'étoiles ? La 3e étoile doit demander un effort, pas être impossible.
19. Bernard-l'Enclume : as-tu compris seul qu'il fallait Protéger ?

## Questions ouvertes pour le directeur
- Le seuil « coque à 50 % » : 10 sur 20 compte-t-il ? (le plan suppose « ≥ 10 = oui »)
- Avec 0 étoile, le butin gardé est-il multiplié par 1 ou non ?
