# Déploiement sur Raspberry Pi

L'application tourne dans **deux conteneurs** : PostgreSQL et un serveur Node qui sert à
la fois l'API et l'interface. Un seul port exposé, pas de reverse proxy à configurer.

---

## 1. Prérequis sur le Pi

- **Raspberry Pi OS, 32 ou 64 bits.** Les deux images de base publient une variante pour
  l'ARM 32 bits, vérifié sur les dépôts officiels :

  | Image | Architectures publiées |
  |---|---|
  | `node:22-alpine` | amd64, **arm/v6**, **arm/v7**, arm64/v8, s390x |
  | `postgres:16-alpine` | amd64, **arm/v6**, **arm/v7**, arm64/v8, 386, ppc64le, riscv64, s390x |

  `uname -m` répond `armv7l` en 32 bits, `aarch64` en 64 bits. Aucun fichier du projet
  n'a besoin d'être adapté : Docker choisit la bonne variante tout seul.

- Docker et le greffon Compose :
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER   # puis se reconnecter
  ```

---

## 2. Installation

```bash
git clone <ton-dépôt> hamsterbudgeo && cd hamsterbudgeo
cp .env.example .env
nano .env              # au minimum : POSTGRES_PASSWORD
docker compose up -d
```

L'application répond ensuite sur `http://<ip-du-pi>:6011`.

Le premier écran propose de **créer un foyer** : c'est la seule inscription à faire, le
conjoint rejoindra ensuite avec un code d'invitation depuis les réglages.

Le premier build prend de dix à vingt minutes sur un Pi 4 — c'est la compilation du
front qui domine. Les suivants sont plus courts si seules les sources ont changé.

### Ce que contient le `.env`

Toutes les variables ont une valeur par défaut : le fichier est facultatif, et
`docker compose up -d` fonctionne sans lui. Il sert à fixer le port (`APP_PORT`) et le
mot de passe de la base.

⚠️ **`POSTGRES_PASSWORD` doit être défini avant le tout premier démarrage.** PostgreSQL
fige le mot de passe à l'initialisation du volume ; le changer ensuite n'a aucun effet
sur la base existante, et l'application ne pourra plus s'y connecter. Pour en changer
après coup : `ALTER USER` dans la base, ou suppression du volume.

Le bloc « développement local » du `.env.example` est **sans effet sur le Pi**. Docker
Compose ne lit ce fichier que pour substituer les variables du fichier compose, il ne
l'injecte pas dans les conteneurs — vérifié : dans le conteneur, `DATABASE_URL` pointe
vers `db:5432` et `SERVER_PORT` vaut 3001, quelles que soient les valeurs du fichier.

### Compiler ailleurs que sur le Pi — recommandé en 32 bits

Sur une machine 32 bits, ce n'est pas qu'une question de patience : **Node y plafonne son
tas à environ 1 Go**, et les modèles de Pi qui tournent en 32 bits n'ont souvent que 512 Mo
à 1 Go de mémoire vive. La compilation du front peut donc échouer sur un manque de
mémoire plutôt que sur une erreur de code.

Construire depuis le PC évite le problème : l'émulation tourne sur la machine de
développement, le Pi ne reçoit que le résultat.

```bash
# Sur le PC — remplacer arm/v7 par arm64 si le Pi est en 64 bits
docker buildx build --platform linux/arm/v7 -t hamsterbudgeo:latest --load .
docker save hamsterbudgeo:latest | gzip | ssh pi@<ip> "gunzip | docker load"
```

Puis sur le Pi, dans `docker-compose.prod.yml`, remplacer `build: .` par
`image: hamsterbudgeo:latest` et lancer `docker compose -f docker-compose.prod.yml up -d`.

Si tu préfères compiler sur le Pi malgré tout, augmente la mémoire d'échange
(`/etc/dphys-swapfile`, `CONF_SWAPSIZE=2048`) avant de lancer la construction.

---

## 3. Exploitation

| Besoin | Commande |
|---|---|
| Journaux | `docker compose logs -f app` |
| État des conteneurs | `docker compose ps` |
| Mise à jour | `git pull && docker compose up -d --build` |
| Arrêt | `docker compose down` |
| Sauvegarde ponctuelle | `docker compose exec db pg_dump -U hamster hamsterbudgeo > sauvegarde.sql` |

**Démarrage automatique au boot** : rien à faire. `restart: unless-stopped` suffit dès
lors que le service Docker démarre avec le système, ce qui est le cas par défaut.

**Les migrations sont jouées au démarrage du conteneur.** Une mise à jour qui ajoute une
table s'applique donc seule, sans étape manuelle à oublier.

---

## 4. Le point HTTPS

Sur un réseau domestique en HTTP, deux limites apparaissent :

1. **L'application n'est pas installable** sur le téléphone. Le navigateur refuse
   d'enregistrer un service worker hors contexte sécurisé, et une adresse IP locale n'en
   est pas un. « Ajouter à l'écran d'accueil » posera un raccourci, mais l'application
   s'ouvrira dans le navigateur, avec sa barre d'adresse.
2. **Le cookie de session circule en clair.** Sur un réseau domestique le risque est
   faible, mais il n'est pas nul.

Trois options, de la plus simple à la plus propre :

| Option | Ce que ça donne | Coût |
|---|---|---|
| **Rien** | Fonctionne sur le réseau local, sans installation PWA | Nul |
| **Tailscale** | HTTPS et nom de domaine fournis, accessible hors du domicile | Un compte, un client sur chaque appareil |
| **Caddy + nom de domaine** | Certificat Let's Encrypt automatique | Un domaine, une redirection de port |

Le jour où l'application passe en HTTPS, mettre `HTTPS=true` dans le `.env` : le cookie
de session devient alors `secure`. **Ne pas l'activer en HTTP** — cela empêcherait toute
connexion.

---

## 5. Ce qui a été vérifié

L'image et la pile de production ont été construites et exécutées avant livraison :

- Image de **182 Mo** en 64 bits, **160 Mo** en 32 bits, sans sources TypeScript ni
  outils de compilation.
- **Construction et exécution vérifiées en `linux/arm/v7`** (32 bits), sous émulation :
  `uname -m` répond `armv7l`, Node tourne en `arm`, l'API répond, le front est servi, et
  le jeu de démonstration se charge avec ses 2 866,51 € de virements permanents.
- Migrations appliquées automatiquement au premier démarrage.
- Sonde de vie au vert — elle interroge réellement PostgreSQL.
- Front et API servis par le même processus, `/budgets/2` accessible en URL directe.
- `/api/etat` sans session : **401**. Route de débogage absente en production.
- Inscription, chargement du jeu de démonstration, puis **redémarrage complet** :
  les données survivent (2 866,51 € de virements permanents retrouvés à l'identique).
- Fuseau du conteneur : `CEST`, soit Europe/Paris.
