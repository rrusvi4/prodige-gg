# PRODIGE.GG

Simulateur de carrière esport — vis les débuts amateurs, la montée, et la fin de carrière
(légendaire ou non) d'un joueur pro, à travers des choix qui comptent vraiment.

Ce projet est la version "site autonome" du jeu : il tourne dans n'importe quel navigateur,
sans dépendre de l'environnement Claude. Toute la sauvegarde (Panthéon, badges, Crédits
Prodige, cosmétiques, préférences...) utilise le `localStorage` du navigateur — les données
restent sur l'appareil de la personne qui joue, rien n'est envoyé à un serveur.

## Lancer en local

Il faut [Node.js](https://nodejs.org) installé (version 18 ou plus récente).

```bash
npm install
npm run dev
```

Le site s'ouvre sur `http://localhost:5173`. Toute modification du code se recharge
automatiquement.

## Déploiement

Le projet est connecté à Vercel via GitHub ([github.com/rrusvi4/prodige-gg](https://github.com/rrusvi4/prodige-gg))
— chaque `git push` sur `main` déclenche automatiquement un nouveau déploiement en production,
pas d'action manuelle nécessaire.

### Brancher un nom de domaine

Il suffit d'acheter un nom de domaine (chez n'importe quel registrar : Namecheap, OVH, Google
Domains...) et de l'ajouter dans les réglages "Domains" du projet Vercel — la procédure est
expliquée pas à pas (quelques enregistrements DNS à copier-coller chez le registrar).

## Structure du projet

```
src/
  main.jsx            → point d'entrée, monte l'app React
  storageShim.js       → remplace l'API de stockage Claude par le localStorage du navigateur
  EsportCareerGame.jsx → tout le jeu (contenu, logique, écrans)
  index.css            → styles globaux + Tailwind
index.html
```

## Notes importantes

- **Aucune donnée n'est envoyée à un serveur.** Tout est stocké localement dans le navigateur
  de la personne qui joue (`localStorage`). Si elle change de navigateur ou d'appareil, sa
  progression ne suit pas — c'est une limite connue de cette approche, à garder en tête.
- Si un jour tu veux une vraie synchronisation entre appareils (compte utilisateur, progression
  partagée), il faudra remplacer `storageShim.js` par de vrais appels à une base de données
  avec un backend. Non nécessaire pour une première mise en ligne.
