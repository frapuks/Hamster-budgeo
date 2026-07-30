# HamsterBudgeo — Plan d'implémentation

Découpage en **13 lots livrables**, chacun testable de bout en bout avant de passer au suivant.
Cible : d'abord tout faire tourner en local sur le PC, le Raspberry Pi n'arrive qu'au lot 13.

Spec de référence : [brainstorm-produit.md](brainstorm-produit.md).

---

## 1. Choix techniques

| Domaine | Choix | Pourquoi |
|---|---|---|
| Front | **React + Vite + TypeScript** | Démarrage instantané, build simple, HMR rapide |
| Composants & style | **MUI** | Bibliothèque complète et thémable, adaptée à une app de formulaires et de listes |
| Données côté front | **TanStack Query, une seule clé** (voir §1.3) | Cache, navigation instantanée et devtools, sans logique d'invalidation |
| Routage | **React Router** | Standard, suffisant |
| Back | **Node + TypeScript + Fastify** | Plus léger et plus rapide qu'Express, typage natif des routes |
| Base | **PostgreSQL 16** | Déjà décidé |
| Accès base | **`postgres.js`, SQL écrit à la main** | Pas d'ORM (voir §1.1) |
| Migrations | **Fichiers `.sql` numérotés** + un runner maison | Cohérent avec le choix du SQL |
| Auth | **Session en cookie httpOnly**, stockée en base | Pas de token côté client, révocable, adapté à l'auto-hébergement |
| Mots de passe | **`bcryptjs`** | Pur JS : pas de compilation native au build ARM |
| Validation | **Zod**, partagé front / back | Un seul schéma pour le formulaire et la requête |
| Tests | **Vitest** | Même moteur que Vite, config quasi nulle |

### 1.1 Pas d'ORM : SQL écrit à la main

**Client : `postgres.js`.** Il donne des requêtes en template littéral avec paramétrage automatique
— l'interpolation produit un paramètre lié, pas une concaténation, donc pas d'injection SQL
possible tout en gardant du SQL lisible :

```ts
const charges = await sql`
  SELECT id, nom, montant_cents AS "montantCents", type, jour_prelevement AS "jourPrelevement"
  FROM charge
  WHERE compte_id = ${compteId} AND actif
  ORDER BY jour_prelevement
`
```

L'alternative classique est `pg` (node-postgres), plus répandu mais nettement plus verbeux
(`$1`, `$2`, tableau de valeurs). Les deux sont du pur JS et tournent sans problème sur ARM.

Trois conventions à poser dès le départ, sinon elles se paient cher plus tard :

1. **Base en `snake_case`, code en `camelCase`, conversion explicite dans le `SELECT`**
   (`montant_cents AS "montantCents"`). Les guillemets doubles sont obligatoires, sans quoi
   PostgreSQL passe tout en minuscules.
2. **Aucune requête SQL dans un gestionnaire de route.** Un module par table dans
   `server/src/db/`, exposant des fonctions nommées (`listerChargesDuCompte`, `cocherCharge`…).
   Les routes appellent ces fonctions, rien d'autre.
3. **Les types de retour sont écrits à la main** dans `shared/types.ts`. Sans ORM, rien ne garantit
   que le type déclaré correspond à la requête : c'est le prix à payer, et la raison pour laquelle
   les fonctions du point 2 doivent rester peu nombreuses et bien nommées.

**Migrations** : des fichiers `server/migrations/001_initial.sql`, `002_....sql`, appliqués par un
runner d'une trentaine de lignes qui tient une table `schema_migrations` et exécute chaque fichier
manquant dans une transaction. Pas de dépendance, pas de magie, et le schéma reste lisible en SQL.

### 1.2 MUI plutôt que Tailwind — oui, et voici le coût réel

C'est un bon choix pour cette app : elle est faite de formulaires, de listes, de cases à cocher, de
sélecteurs et de bottom sheets. MUI fournit tout ça déjà accessible et déjà testé, là où Tailwind
ne fournit que des classes utilitaires.

La correspondance avec les écrans de la spec est directe :

| Besoin | Composant MUI |
|---|---|
| Bottom sheet de saisie | `Drawer` avec `anchor="bottom"` |
| Checklist des prélèvements | `List` + `ListItemButton` + `Checkbox` |
| Jauges de budget | `LinearProgress` avec `sx` |
| Sélecteur « Charges / Budgets » | `ToggleButtonGroup` |
| Barre d'onglets du bas | `BottomNavigation` |
| Carrousel de comptes | `Stack` horizontal + `scroll-snap` en `sx` |
| Confirmation de reset | `Dialog` |

**Le coût, à budgéter honnêtement** : MUI a l'air de Material Design par défaut, ce qui ne
ressemble pas du tout à Revolut. Il faut un vrai travail de thème en amont — palette sombre,
`shape.borderRadius` à 20, typographie à chiffres tabulaires, ondulations désactivées, `Paper` et
`Button` surchargés. C'est une tâche à part entière, pas un réglage de cinq minutes, et je l'ai
sortie en **lot 0 bis** pour qu'elle soit faite une bonne fois avant le premier écran.

Deux règles pour que ça reste sain :
- **Pas de Tailwind en plus.** Mélanger les deux est une source connue de conflits de spécificité.
- **Tout le style passe par le thème et la prop `sx`**, jamais de fichiers CSS parallèles. Le thème
  est la source unique des couleurs et des rayons.

### 1.3 Cache côté front : TanStack Query, avec une seule clé

**Décidé : TanStack Query.** Mais employé d'une façon particulière, qui supprime la seule vraie
difficulté de la bibliothèque.

L'usage habituel découpe les données en plusieurs clés (`['comptes']`, `['budgets']`,
`['charges', id]`…) et oblige à savoir, à chaque mutation, lesquelles invalider. C'est là que
naissent les bugs d'écrans désynchronisés : on coche une charge, le détail du compte se met à jour,
l'accueil non — parce qu'on a oublié une invalidation.

Ici, ce découpage n'a aucun intérêt : **l'état complet du foyer tient dans une dizaine de
kilo-octets** et n'a pas d'historique. Donc une seule clé :

```ts
// Lecture — tous les écrans lisent la même chose
const { data: etat } = useQuery({
  queryKey: ['etat'],
  queryFn: () => api.getEtat(),
  staleTime: 5 * 60_000,        // pas de refetch en boucle en navigation
  refetchOnWindowFocus: true,   // utile quand vous êtes deux à saisir
})

// Écriture — la réponse du serveur EST le nouvel état
const cocher = useMutation({
  mutationFn: api.cocherCharge,
  onSuccess: (nouvelEtat) => queryClient.setQueryData(['etat'], nouvelEtat),
})
```

Ce que tu obtiens :

| | |
|---|---|
| **Navigation instantanée** | Les écrans lisent le cache, aucun rechargement en changeant d'onglet |
| **Zéro invalidation à écrire** | La réponse de mutation remplace directement le cache |
| **Impossible de désynchroniser deux écrans** | Ils lisent tous le même objet |
| **Rafraîchissement au retour sur l'app** | `refetchOnWindowFocus` — utile si ta femme saisit une dépense de son côté |
| **Devtools** | Inspection du cache et des mutations en développement |
| **Optimistic UI** | `onMutate` sur la case à cocher : bascule immédiate, correction si le serveur refuse |

Côté serveur, ça impose une convention simple : **`GET /api/etat` renvoie tout l'état calculé, et
chaque mutation renvoie ce même état complet en réponse** plutôt que l'objet modifié seul.

Si l'app grossit un jour au point que ce soit trop lourd, découper en plusieurs clés se fait de
façon incrémentale, sans rien casser — l'inverse (partir de dix clés et devoir les recoudre) serait
bien plus pénible.

Pour mémoire, les autres options écartées : **SWR** (~5 Ko, même principe mais moins outillé),
**loaders React Router** (impose d'organiser les données par route), **RTK Query** (~30 Ko,
pertinent seulement avec Redux), ou **aucun cache** (un contexte React suffisait techniquement,
mais tu perdais les devtools et le refetch au focus).

### 1.4 La règle non négociable : les montants sont des entiers

**Tous les montants sont stockés et manipulés en centimes, dans des entiers.** Jamais de flottant.
`0.1 + 0.2 !== 0.3`, et une app de budget qui dérive d'un centime perd toute crédibilité.

- En base : `montant_cents INTEGER NOT NULL`
- Dans le code : des entiers partout, une seule fonction `formatEuros(cents)` pour l'affichage
- Division (le lissé annuel) : `Math.round(cents / 12)`

Conséquence à assumer : une charge annuelle de 250 € donne 20,83 €/mois, et 20,83 × 12 = 249,96 €.
L'écart de 4 centimes est normal et ne doit **jamais** être rattrapé par un ajustement automatique
— ça créerait des chiffres instables d'un mois à l'autre. Le jeu de démo est construit avec des
montants divisibles par 12 pour que le cas ne se présente pas au début.

### 1.5 Structure du dépôt

```
hamsterbudgeo/
├─ docker-compose.yml          # Postgres en dev, tout l'applicatif en prod
├─ package.json                # npm workspaces
├─ shared/
│  ├─ types.ts                 # types de domaine, écrits à la main
│  ├─ calculs.ts               # coutMensuelLisse, virementPermanent, resteASortir…
│  ├─ schemas.ts               # schémas Zod partagés
│  └─ format.ts                # formatEuros, formatDate
├─ server/
│  ├─ migrations/001_initial.sql
│  ├─ src/db/                  # un module par table, tout le SQL vit ici
│  ├─ src/routes/
│  └─ src/seed.ts
└─ web/
   ├─ src/theme.ts             # le thème MUI, source unique du style
   ├─ src/api/                 # les appels HTTP, centralisés
   ├─ src/hooks/useEtat.ts     # la query unique ['etat'] et les mutations
   ├─ src/pages/
   └─ src/components/
```

**`shared/calculs.ts` est le cœur du produit.** Fonctions pures, sans accès base, testées
unitairement, utilisées à l'identique par le serveur et le client. C'est là que vit
`coutMensuelLisse` — la parade au piège du §8.1 de la spec.

---

## 2. Les lots

Chaque lot se termine par une **vérification manuelle** que tu fais toi-même avant qu'on passe au
suivant.

### Lot 0 — Socle qui tourne
Squelette du dépôt en workspaces, `docker-compose.yml` avec Postgres seul, serveur Fastify avec
`/api/health`, app Vite + MUI, barre d'onglets du bas avec 4 pages vides.

✅ **Vérif** : `docker compose up -d db` puis `npm run dev` → la page s'ouvre, les 4 onglets
naviguent, `/api/health` répond.

---

### Lot 0 bis — Le thème
Le thème MUI complet : palette sombre (`#0A0A0C` de fond, `#16171C` en surface, dégradé
bleu-violet en accent, vert menthe et corail sémantiques), `borderRadius` à 20, typographie à
chiffres tabulaires, ondulations désactivées, surcharges de `Paper`, `Button`, `ListItem`.
Une page de démonstration listant les composants stylés côte à côte.

✅ **Vérif** : sur la page de démo, aucun composant n'a l'air « Material » par défaut. C'est ici
qu'on valide l'identité visuelle, avant d'avoir un seul écran réel à retoucher.

---

### Lot 1 — Schéma SQL et jeu de démo
`001_initial.sql` avec toutes les tables de la spec §4, le runner de migrations, le seed reprenant
**exactement** les chiffres du §7, et une route `GET /api/debug/dump`.

✅ **Vérif** : `npm run migrate && npm run seed`, puis `/api/debug/dump` → 3 comptes, 14 charges,
4 budgets, 2 personnes, montants en centimes.

---

### Lot 2 — Moteur de calcul et écran d'accueil
`shared/calculs.ts` et ses tests, `GET /api/etat` qui renvoie l'état complet calculé, la mise en
place de TanStack Query avec la clé unique `['etat']`, et l'écran d'accueil : reste à sortir global, carrousel des 3 comptes, liste des budgets,
pilule « Dernier reset le 01/07/2025 ».

Les tests incluent **celui qui rattrape le piège du montant** : une charge annuelle de 600 €
contribue 50 €/mois au virement permanent, pas 600 €.

✅ **Vérif** : les chiffres correspondent au centime près au §7 — reste à sortir global
**1 351,82 €**, cartes à **1 251,55 €**, **558,27 €**, **122,50 €**, virements permanents
**1 458,76 €**, **1 285,25 €**, **122,50 €**.

C'est le lot pivot : à partir d'ici la logique métier est verrouillée.

---

### Lot 3 — Checklist des prélèvements
Écran de détail d'un compte `prelevements`, tri par jour, cases à cocher,
`PATCH /api/charges/:id/prelevee` renvoyant l'état complet, mise à jour optimiste.

✅ **Vérif** : cocher le loyer fait passer le reste à sortir de 1 251,55 € à 401,55 €, et l'accueil
suit sans rechargement. Décocher revient en arrière.

---

### Lot 4 — Budgets et dépenses
Écran budgets avec jauges, détail d'un budget, bottom sheet de saisie avec pavé numérique,
suppression d'une dépense.

✅ **Vérif** : ajouter 42 € à Essence → 280 € restants, la jauge bouge, l'accueil suit. Supprimer →
retour à 322 €. Un budget dépassé s'affiche en corail avec un reste négatif.

---

### Lot 5 — Compte de provisions
Écran du compte `provisions` : virement permanent en héros, charges annuelles avec montant annuel
et provision mensuelle, total. Pas de checklist.

✅ **Vérif** : 50 / 25 / 37,50 / 10 €/mois, total 122,50 €/mois et 1 470 €/an.

---

### Lot 6 — Détail du compte courant
Écran mixte avec le sélecteur « Charges » / « Budgets » et le chiffre combiné.

✅ **Vérif** : héros à 558,27 €, ligne « 100,27 € de charges + 458,00 € de budgets ».

---

### Lot 7 — Création et modification des charges
Liste « Mes charges » groupée par type avec sélecteur de groupement, formulaire de création et
d'édition avec le **sélecteur mensuelle / annuelle qui change le libellé d'unité sous le montant**,
suppression.

✅ **Vérif** : créer une charge annuelle de 1 200 € sur l'épargne → le virement permanent du compte
passe de 122,50 € à 222,50 €. La même en mensuelle affiche « par mois » et donne +1 200 €. C'est le
lot où le piège du montant doit devenir visuellement impossible à rater.

---

### Lot 8 — Nouveau cycle
Bottom sheet de confirmation listant ce qui va être effacé, `POST /api/cycle/reset`, mise à jour de
`dernier_reset`.

✅ **Vérif** : après reset, tout est décoché, les dépenses ont disparu, les budgets sont repartis au
maximum, la date affichée est celle du jour.

---

### Lot 9 — Répartition du couple et virements permanents
Écran de répartition avec les 3 modes côte à côte et le choix persisté ; écran « Virements
permanents » avec la part de chacun, ce que reçoit chaque compte, et le total.

✅ **Vérif** : avec 2 800 € et 2 200 €, le prorata donne 1 605,25 € et 1 261,26 €, dont la somme
égale les 2 866,51 € du total des virements permanents.

---

### Lot 10 — Réglages
Personnes et salaires, comptes (création, rôle, couleur, flèches ▲▼), catégories, chargement du jeu
de démo, remise à zéro complète.

✅ **Vérif** : remonter un compte change son ordre sur l'accueil. « Tout effacer » vide l'app,
« Charger la démo » la remplit à l'identique.

---

### Lot 11 — Comptes utilisateurs
Inscription, connexion, session en cookie, code d'invitation, rattachement du `User` à la
`Personne` existante.

**Préparation dès le lot 1** : toutes les tables portent `foyer_id` et toutes les fonctions de
`server/src/db/` prennent un `foyerId` en premier argument, fourni par un middleware — codé en dur
au départ. Ce lot ne fait que remplacer le contenu de ce middleware. Sans cette précaution, il
faudrait reprendre chaque requête SQL une par une.

✅ **Vérif** : créer un compte, se déconnecter, se reconnecter, retrouver ses données. Générer une
invitation, l'ouvrir en navigation privée, créer le second compte, voir les mêmes données.

---

### Lot 12 — PWA
Manifeste, icônes, service worker minimal, installation sur l'écran d'accueil du téléphone.

✅ **Vérif** : depuis le téléphone sur le réseau local, « Ajouter à l'écran d'accueil » donne une
icône qui ouvre l'app en plein écran.

---

### Lot 13 — Docker et déploiement sur le Pi
Build multi-étapes du front et du back, image unique servant les fichiers statiques et l'API,
`docker-compose.yml` de production avec volume Postgres nommé, variables d'environnement, build
`arm64`, démarrage automatique au boot, migrations jouées au démarrage du conteneur.

À traiter ici : la construction des images ARM (build sur le Pi, ou `buildx` depuis le PC), le
fuseau du conteneur en `Europe/Paris`, et l'accès depuis le téléphone — l'IP locale suffit au
début.

✅ **Vérif** : `docker compose up -d` sur le Pi, l'app répond sur le réseau local, les données
survivent à un redémarrage complet de la machine.

---

## 3. Ordre et raccourcis

Les lots 0 à 8 forment le **produit minimal réellement utilisable** : à la fin du lot 8, tu peux
t'en servir pour de vrai en local, sans compte utilisateur. Les lots 9 et 10 ajoutent la
répartition du couple et le confort. Les lots 11 à 13 sont de l'infrastructure.

Si tu veux l'utiliser au plus vite sur ton téléphone, tu peux remonter le lot 13 juste après le
lot 8 et faire tourner l'app sur le Pi sans authentification, accessible uniquement sur ton réseau
local. Raccourci raisonnable pour un usage domestique — à condition d'ajouter l'authentification
avant toute exposition sur Internet.

---

## 4. Ce qu'on ne fait pas en v1

Rappel, pour éviter la dérive en cours de route : pas d'historique, pas de sauvegarde automatique,
pas de notifications, pas de calendrier, pas de solde de compte, pas de bilan annuel, pas de
périodicité autre que mensuelle et annuelle, pas d'arrondi des virements, pas de glisser-déposer,
pas de gestion de droits.
