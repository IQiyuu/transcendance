# ft_transcendence

Site web de **Pong multijoueur en ligne**, avec gestion des utilisateurs, parties à distance et historique des matchs.

Projet final du **tronc commun de 42**.

## Fonctionnalités

* 🎮 Pong jouable à distance (deux joueurs sur deux machines)
* 🖥️ Logique de jeu entièrement côté serveur (*server-side Pong*)
* 👤 Inscription / connexion
* 🖼️ Avatar personnalisé avec upload d'image
* 🔐 Authentification par JWT stocké dans un cookie `secure`
* 📊 Profil utilisateur et historique des 5 dernières parties
* 🔒 Mots de passe hachés avec `bcrypt`

## Stack technique

| Rôle               | Technologie                                         |
| ------------------ | --------------------------------------------------- |
| Backend            | Fastify                                             |
| Base de données    | SQLite (`better-sqlite3`)                           |
| Temps réel         | `@fastify/websocket`                                |
| Authentification   | `@fastify/jwt`, `@fastify/cookie`, `fastify-bcrypt` |
| Upload d'avatars   | `@fastify/multipart`                                |
| Templates          | `@fastify/view` (EJS)                               |
| Fichiers statiques | `@fastify/static`                                   |

> `fs` est un module natif de Node.js : aucune installation supplémentaire n'est nécessaire.

## Base de données

### Historique des parties

Les **5 dernières parties** d'un joueur sont récupérées et affichés dans le profil

## Installation

```bash
git clone <url-du-repo>
cd <repo>

npm install fastify \
  @fastify/view \
  @fastify/cookie \
  @fastify/static \
  @fastify/websocket \
  @fastify/multipart \
  better-sqlite3 \
  fastify-bcrypt \
  @fastify/jwt \
  ejs
```

## Lancement

> À compléter avec la commande utilisée pour démarrer le serveur.

```bash
npm start
```
npm test -- --test-name-pattern="SEC-02"

## Pistes d'amélioration

* 🗄️ Ajouter le type de partie en base de données (`local`, `distant`, `tournoi`)
* 📊 Afficher le type de partie dans l'historique
* 🌐 Ajouter un mode multijoueur avec des plateaux à plusieurs côtés :

  * Triangle pour 3 joueurs
  * Carré pour 4 joueurs
  * Hexagone pour 5 joueurs

## Auteur
IQiyu
Shadwogg
Robin258
Kiwifarcit

Réalisé dans le cadre du **cursus 42** + ajout d'une partie DevSecOps
