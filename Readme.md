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

## Modules

Le projet demande **7 points de modules**.

| Module                                                     | Points | État                             |
| ---------------------------------------------------------- | -----: | -------------------------------- |
| Backend avec Fastify                                       |      1 | ✅ Fait                          |
| Base de données backend                                    |    0.5 | ✅ Fait                          |
| Joueurs à distance                                         |      1 | ✅ Fait                          |
| Pong côté serveur                                          |      1 | ✅ Fait                          |
| Gestion standard des utilisateurs                          |      1 | ✅ Fait                          |
| 2FA                                                        |      1 | ✅ Fait                          |
| Chat en direct (DMs, invitations à jouer, chat de tournoi) |      1 | ✅ Fait                          |

**Total validé : 4.5 points**

## Base de données

### Table `users`

```sql
CREATE TABLE users (
    user_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT NOT NULL,
    password     TEXT NOT NULL,
    picture_path TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `games`

```sql
CREATE TABLE games (
    game_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id    INTEGER NOT NULL,
    loser_id     INTEGER NOT NULL,
    loser_score  INTEGER NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Historique des parties

Les **5 dernières parties** d'un joueur sont récupérées avec la requête suivante :

```sql
SELECT g.game_id,
       uw.username AS winner_username,
       ul.username AS loser_username,
       g.loser_score,
       g.created_at
FROM games g
JOIN users uw ON g.winner_id = uw.user_id
JOIN users ul ON g.loser_id = ul.user_id
WHERE uw.username = ? OR ul.username = ?
ORDER BY g.created_at DESC
LIMIT 5;
```

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

Réalisé dans le cadre du **cursus 42**.
