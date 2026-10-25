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

## Mettre en ligne gratuitement

### Option Vercel (recommandée, la plus simple)

1. Créer un compte gratuit sur [vercel.com](https://vercel.com)
2. Installer l'outil en ligne de commande : `npm install -g vercel`
3. Depuis ce dossier : `vercel`
4. Suivre les instructions (Vercel détecte automatiquement qu'il s'agit d'un projet Vite)

Vercel donne immédiatement une URL gratuite du type `prodige-gg.vercel.app`, utilisable tout
de suite pour tester ou partager, avant même de brancher un nom de domaine.

### Option Netlify (équivalente)

1. Créer un compte gratuit sur [netlify.com](https://netlify.com)
2. `npm run build` (génère le dossier `dist/`)
3. Glisser-déposer le dossier `dist/` sur [app.netlify.com/drop](https://app.netlify.com/drop)

### Brancher un nom de domaine (plus tard, une fois que tout est testé)

Une fois le site en ligne sur Vercel ou Netlify avec son URL gratuite, il suffit d'acheter un
nom de domaine (chez n'importe quel registrar : Namecheap, OVH, Google Domains...) et de
l'ajouter dans les réglages "Domains" du projet Vercel/Netlify — les deux expliquent la
procédure pas à pas (quelques enregistrements DNS à copier-coller chez le registrar).

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
- Ce build n'a pas pu être testé automatiquement dans l'environnement où il a été généré
  (accès réseau restreint pour installer les dépendances). La configuration suit cependant les
  standards Vite + React + Tailwind habituels — teste avec `npm install && npm run dev` et
  signale tout souci de build.
