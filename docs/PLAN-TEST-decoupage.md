# Plan de test : version découpée (après v0.7.4)

But : vérifier que la version découpée en plusieurs fichiers se joue **exactement comme la v0.7.4**. Rien de nouveau ne doit apparaître, rien ne doit disparaître.

Appareils : **G85** (tactile, paysage, Chrome Android) et **PC** (navigateur, clavier et souris).
Faire chaque point sur les deux sauf mention contraire. Noter ✅ / ❌ ; un ❌ se signale dans le fil Directeur.

## A. Démarrage et mise à jour
1. **Mise à jour sans perte (priorité)** — Avant la mise à jour, note tes réglages (volumes, gaucher, langue) et ta latence dans Options. Après la mise à jour : tout est identique, aucun nouveau calibrage demandé. *(La sauvegarde est sous la clé `koa.save` : elle ne doit pas changer de nom sans migration.)*
2. La page affiche bien la nouvelle version (numéro dans Options ou notes de MAJ), pas l'ancienne en cache. Si besoin : fermer et rouvrir l'appli une fois.
3. **G85** — L'appli installée sur l'écran d'accueil s'ouvre en plein écran et en paysage.
4. Mode avion (G85) ou réseau coupé (PC) puis relancer : le jeu s'ouvre, la musique joue.

## B. Rythme (priorité)
5. Calibrer le son : le décompte, les 12 temps et le résultat se passent comme avant ; la valeur en ms est proche de l'ancienne.
6. La musique et le métronome restent calés sur le tempo pendant toute une partie (aucun décalage qui grandit).
7. Les 4 ordres marchent : avancer (BOUM TAK BOUM TAK), attaquer (BOUM BOUM TAK TAK), protéger (BOUM BOUM BOUM DING), soigner (BOUM BOUM TAK DING).
8. Les notes Parfait / Bien / Tôt / Tard et le combo s'affichent comme avant ; un ordre faux casse le combo.
9. **PC** — Touches J = BOUM, F = TAK, D = DING ; garder une touche enfoncée ne répète pas le son.
10. **G85** — Les 3 tambours réagissent tout de suite, même en tapant vite à deux doigts ; vibration présente.

## C. Partie
11. Une partie complète : 3 monstres (dont le gros), arrivée au port, écran de victoire avec les stats. Pas de game over.
12. Quitter l'appli en pleine partie (bouton accueil / changer d'onglet) : pause automatique ; à la reprise le tempo repart proprement.

## D. Options
13. Volumes musique et Bruitages, vibrations, voix de l'équipage, métronome, cadre d'aide : chaque réglage agit et reste après relance.
14. Mode gaucher : les tambours s'inversent ; le changement est gardé.
15. Langue FR ↔ EN : tous les textes changent, aucun texte manquant ni code bizarre (`cmdADV`…).

## Bonus PC
16. Ouvrir la console du navigateur (F12) : aucune erreur rouge pendant une partie.
