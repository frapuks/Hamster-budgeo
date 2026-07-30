# HamsterBudgeo — Spec v1

Périmètre volontairement minimal : une première version utilisable, à faire évoluer après usage
réel. Concepts, modèle de données, règles de calcul, écrans.

**Stack** : React + Node + PostgreSQL, Docker sur Raspberry Pi. Mobile-first, PWA.
**Design de référence** : Revolut (sombre, contrasté, gros chiffres, cartes arrondies).

---

## 1. Ce que l'application produit

Deux nombres, et deux seulement. Tout le reste est à leur service.

| | **Le virement permanent** | **Le reste à sortir** |
|---|---|---|
| Nature | Lissé, théorique | Réel, effectif |
| Stabilité | **Fixe** — configuré une fois à la banque | Change à chaque case cochée |
| Réponse à | « Combien alimenter chaque mois ? » | « Est-ce que le compte tient jusqu'à la fin ? » |
| Consulté | Une fois par an | Plusieurs fois par mois |

C'est la clé de voûte. Le virement permanent est l'objectif : le configurer une fois et ne plus y
toucher. Le reste à sortir est l'usage quotidien. L'un finance l'autre.

Et les deux se rejoignent : **la somme des virements permanents de tous les comptes est exactement
le total réparti dans le couple** (2 866,51 € dans le jeu de démo). Voir §3.3.

---

## 2. Périmètre de la v1

### Trois types d'objets, pas un de plus

| Objet | Montant saisi | Périodicité | Où | Suivi |
|---|---|---|---|---|
| **Charge mensuelle** | par mois | mensuelle | Comptes de prélèvement | On **coche** quand c'est passé |
| **Charge annuelle** | **par an** | annuelle | Compte épargne | On **provisionne** montant/12 chaque mois |
| **Budget** | par mois | mensuelle | Compte de dépenses courantes | On **décrémente** à chaque dépense |

### La simplification qui fait tout tomber

En saisissant les charges rares **en montant annuel**, la périodicité disparaît complètement du
modèle. L'eau prélevée 300 € deux fois par an ? C'est **600 € par an**, provisionnés à
**50 €/mois**. Tous les 6 mois, tous les 3 mois, deux fois par an de façon irrégulière : peu
importe, `montant / 12` donne toujours le bon résultat.

Ce qui disparaît par rapport aux versions précédentes de ce document :

| Supprimé | Remplacé par |
|---|---|
| Périodicité `intervalle` + `unité` | Un enum `mensuelle` / `annuelle` |
| Le moteur d'occurrences (~15 lignes + ses 2 pièges) | Rien — une charge mensuelle apparaît une fois, point |
| `date_ancrage` | Un simple `jour_prelevement` (1..31), pour trier |
| `dates_cochees date[]` | Un booléen `est_prelevee` |
| La fenêtre de cycle glissante et le cas du 31 | Rien |

### Reporté après usage réel

- Le prélèvement **toutes les 4 semaines**. La parade en v1 : saisir la salle de sport à 29 €/mois
  comme charge mensuelle, et ne rien faire du 13ᵉ prélèvement. Tu dérives de ~29 €/an, ce qui est
  sans conséquence. Si ça te gêne à l'usage, ajoute une charge annuelle de 29 € sur l'épargne —
  décision réversible, sans migration.
- Les prochaines échéances des provisions (nécessiterait un mois d'échéance par charge).
- Le calendrier, l'historique, le bilan annuel, les notifications, le solde des comptes.

---

## 3. Concepts

### 3.1 Les comptes portent la structure de l'app

Ton fonctionnement en 3 comptes n'est pas un détail d'usage, c'est **l'architecture**. Chaque compte
a un **rôle** qui détermine son contenu et le comportement de son écran.

| Rôle | Ton compte | Contient | Virement permanent | Écran |
|---|---|---|---|---|
| `prelevements` | Crédit Mutuel | Charges mensuelles | 1 458,76 € | Checklist |
| `courant` | Carte Revolut | Charges mensuelles + budgets | 1 285,25 € | Checklist + jauges |
| `provisions` | Épargne Revolut | Charges annuelles | 122,50 € | Pas de checklist |

Le compte `provisions` n'a pas de case à cocher : quand l'eau tombe, l'argent part de l'épargne où
il t'attendait — ça ne change rien à ton reste à sortir du mois.

### 3.2 Les deux nombres d'une carte de compte

Chaque compte affiche deux nombres de natures différentes, que l'UI ne doit jamais laisser
confondre :
- **En grand** : le reste à sortir, qui bouge.
- **En petit, dans une pilule grise discrète** : « alimenté par un virement de 1 285,25 €/mois ».

### 3.3 La boucle qui se referme

```
Σ virements permanents  =  Σ charges lissées + Σ budgets  =  total réparti dans le couple
1 458,76 + 1 285,25 + 122,50  =   1 696,51 + 1 170,00     =        2 866,51 €
```

Le workflow réel complet, que l'app doit énoncer noir sur blanc :

1. Hélène met en place un virement permanent de **1 605,25 €** vers les comptes communs.
2. Francis met en place un virement permanent de **1 261,26 €**.
3. Ces 2 866,51 € alimentent les 3 comptes à hauteur de leurs virements respectifs.
4. Plus personne ne touche à rien. On coche, c'est tout.

C'est le livrable final de l'application : **une liste de virements permanents à créer une fois
dans son appli bancaire.** D'où l'écran dédié « Virements permanents » (§6).

### 3.4 Le temps dans l'application

L'app ne stocke que : les **charges** et leur répartition dans les **comptes**, l'**état coché** de
chacune, les **budgets** et les **dépenses du mois courant**. Pas d'historique, pas de clôture, pas
de sauvegarde.

Le seul objet temporel est le **cycle courant** : la période qui commence au dernier appui sur
Reset. En pratique, ton mois. Un champ `dernier_reset` suffit à le porter, et alimente la mention
« Dernier reset le 01/07/2025 » qui te protège de l'oubli.

⚠️ **Le reset est destructif et irréversible.** Confirmation explicite obligatoire, listant ce qui
va être effacé.

---

## 4. Modèle de données

```
User (id, email, password_hash, foyer_id, personne_id?)
Foyer (id, nom, mode_repartition, dernier_reset: date)
Invitation (id, foyer_id, personne_id, token, expire_le)

Personne (id, foyer_id, prenom, salaire_net_mensuel, couleur, user_id?)

Compte (id, foyer_id, nom, banque, role: 'prelevements'|'courant'|'provisions',
        couleur, ordre: int)

Categorie (id, foyer_id, nom, icone, couleur)

Charge (id, compte_id, nom, categorie_id,
        type: 'mensuelle'|'annuelle',
        montant,                  -- par mois si mensuelle, PAR AN si annuelle
        jour_prelevement?: int,   -- 1..31, mensuelles uniquement, sert au tri
        est_prelevee: bool,       -- mensuelles uniquement, remis à false au reset
        actif: bool)

Budget (id, compte_id, nom, montant_mensuel, categorie_id, ordre: int)
Depense (id, budget_id, libelle, montant, date, personne_id?)
        -- mois courant uniquement, vidée au reset
```

Notes :
- **`type`** peut être pré-rempli d'après le rôle du compte choisi (`provisions` → annuelle), mais
  reste modifiable. C'est plus clair qu'une déduction implicite.
- **`montant` change d'unité selon `type`.** Voir §8.1 : c'est le seul piège du modèle.
- **Pas de champ `ordre` sur `Charge`** : le tri est toujours calculé (§8.4). Seuls `Compte` et
  `Budget` en ont un.
- **`dernier_reset` est affiché**, pas seulement stocké : « Dernier reset le 01/07/2025 », sur
  l'accueil et dans les réglages. Voir §8.3.
- **Le reset** = `UPDATE foyer SET dernier_reset = CURRENT_DATE` +
  `UPDATE charge SET est_prelevee = false` + `DELETE FROM depense`. Trois requêtes.
- **`Depense` reste une table** plutôt qu'un compteur : ça permet de corriger une saisie erronée
  (780 € au lieu de 78 €). Vidée au reset, donc toujours pas d'historique.
- **`Personne.user_id` nullable** : gérer le couple seul, puis inviter. Le jour où Hélène s'inscrit,
  son `User` se rattache à la `Personne` existante — zéro migration.
- **Aucun champ `solde`**, nulle part. **Aucune table de droits** : les deux membres sont
  propriétaires à égalité.

---

## 5. Règles de calcul

Elles tiennent en cinq lignes. C'est le signe que le périmètre est bon.

```
cout_mensuel_lisse(charge)  = charge.type = 'mensuelle' ? charge.montant : charge.montant / 12

virement_permanent(compte)  = Σ cout_mensuel_lisse(charges du compte)
                            + Σ montant_mensuel(budgets du compte)

reste_a_sortir(compte)      = Σ montant des charges mensuelles NON cochées

reste_a_depenser(budget)    = budget.montant_mensuel − Σ dépenses du mois

besoin_du_mois(compte)      = reste_a_sortir(compte) + Σ reste_a_depenser(budgets du compte)
```

L'app ne connaît pas ton solde et ne le demandera jamais. Son rôle est de produire **le nombre que
tu compares** au solde que tu lis dans ton appli bancaire.

### Répartition dans le couple

Base = **le lissé**, jamais le montant brut — sinon la part de chacun bougerait d'un mois à
l'autre, ce qui est incompatible avec un virement permanent.

```
C = Σ virement_permanent de tous les comptes
A, B = salaires nets
```

| Mode | Formule | Avec A=2 800, B=2 200, C=2 866,51 |
|---|---|---|
| **Moitié-moitié** | `pA = pB = C/2` | 1 433,26 / 1 433,25 → reste à vivre 1 366,74 / 766,75 |
| **Prorata des revenus** | `pA = C × A/(A+B)` | 1 605,25 / 1 261,26 → 1 194,75 / 938,74 |
| **Reste à vivre égal** | `pA = (C + A − B)/2` | 1 733,26 / 1 133,25 → 1 066,74 / 1 066,75 |

Les trois modes s'affichent **côte à côte** avec le reste à vivre résultant : c'est un outil de
discussion de couple, pas un réglage enfoui.

---

## 6. Écrans

### v1
1. **Accueil** : carrousel de cartes de comptes + budgets + bouton nouveau cycle
2. **Détail compte `prelevements`** : checklist, reste à sortir
3. **Détail compte `courant`** : checklist + jauges de budgets
4. **Détail compte `provisions`** : virement du mois, charges annuelles lissées
5. **Budgets** : liste à jauges + saisie de dépense (bottom sheet)
6. **Charges** : liste groupée par type (§8.4) + formulaire création/édition
7. **Répartition du couple** : salaires + comparateur des 3 modes
8. **Virements permanents** : la liste des ordres à créer à la banque ← *le livrable*
9. **Nouveau cycle** : confirmation
10. **Réglages** : comptes, catégories, foyer, invitation, réordonnancement
11. **Connexion / Inscription / Rejoindre un foyer**

### Onboarding
Un **jeu de données de démo en dur** chargé au premier lancement, plus un bouton « Repartir de
zéro » dans les réglages. Le questionnaire coûte plus cher à construire et donne un moins bon
résultat. Bénéfice secondaire : ce seed est aussi ta fixture de dev et ton jeu de test.

---

## 7. Le jeu de données (seed et tests)

Chiffres cohérents entre eux — chaque total est vérifiable à partir des lignes qui le composent,
ce qui en fait aussi un jeu d'assertions pour les tests.

**Compte prélèvements — Crédit Mutuel** · virement permanent **1 458,76 €/mois**
· total **1 458,76 €** · coché **207,21 €** · **reste 1 251,55 €**

| Jour | Charge | Montant | État |
|---|---|---|---|
| 2 | Netflix | 13,49 € | ✅ |
| 5 | EDF | 96,40 € | ✅ |
| 8 | Mutuelle | 97,32 € | ✅ |
| 10 | Loyer | 850,00 € | |
| 12 | Assurance habitation | 34,90 € | |
| 15 | Internet | 39,99 € | |
| 18 | Téléphone | 19,99 € | |
| 20 | Assurance auto | 62,30 € | |
| 25 | Impôt sur le revenu | 244,37 € | |

**Compte carte — Revolut** · virement permanent **1 285,25 €/mois**
· charges **115,25 €** · coché **14,98 €** · reste **100,27 €**

| Jour | Charge | Montant | État |
|---|---|---|---|
| 3 | Salle de sport | 29,00 € | |
| 4 | Spotify | 11,99 € | ✅ |
| 6 | iCloud | 2,99 € | ✅ |
| 14 | Assurance téléphone | 8,99 € | |
| 20 | Abonnement transport | 62,28 € | |

**Budgets (sur le compte carte)** · budgété **1 170 €** · dépensé **712 €** · restant **458 €**

| Budget | Montant | Dépensé | Restant |
|---|---|---|---|
| Courses | 400 € | 312 € | 88 € |
| Essence | 400 € | 78 € | 322 € |
| Restaurants | 250 € | 190 € | 60 € |
| Loisirs | 120 € | 132 € | −12 € |

→ Compte carte, à couvrir ce mois : 100,27 + 458,00 = **558,27 €**
→ Virement permanent : 115,25 + 1 170,00 = **1 285,25 €**

**Compte épargne provisions — Revolut** · virement permanent **122,50 €/mois** · couvre **1 470 €/an**

| Charge | Montant annuel | Provision mensuelle |
|---|---|---|
| Eau | 600,00 € | 50,00 € |
| Ordures ménagères | 300,00 € | 25,00 € |
| Entretien voiture | 450,00 € | 37,50 € |
| Ramonage chaudière | 120,00 € | 10,00 € |

**Accueil** : reste à sortir global **1 351,82 €** sur 1 574,01 € prévus.
**Total des virements permanents** : 1 458,76 + 1 285,25 + 122,50 = **2 866,51 €/mois**

**Foyer** : Hélène 2 800 € · Francis 2 200 € · mode prorata
→ Hélène **1 605,25 €**, Francis **1 261,26 €**.

---

## 8. Décisions d'implémentation

### 8.1 Le piège du champ `montant` — et sa parade

Ce n'est pas une question ouverte, c'est le seul endroit du modèle où une erreur produit
silencieusement un résultat faux d'un facteur 12.

Le champ `montant` **ne veut pas dire la même chose selon `type`** :

| Charge | `type` | `montant` en base | Signification |
|---|---|---|---|
| Loyer | `mensuelle` | `850` | 850 € **par mois** |
| Eau | `annuelle` | `600` | 600 € **par an**, soit 50 €/mois |

Deux lignes, deux `600` possibles, deux sens différents. Le jour où un bout de code additionne
naïvement les `montant` d'un compte pour calculer un virement permanent, il compte l'eau à
600 €/mois au lieu de 50 € — et rien ne plante, le chiffre est juste un peu gros.

**La parade, actée** : *aucun code ne lit jamais `charge.montant` directement pour faire un
calcul.* Tout passe par une fonction unique :

```
coutMensuelLisse(charge) = charge.type === 'mensuelle' ? charge.montant : charge.montant / 12
```

Seuls le formulaire de saisie et l'affichage d'une ligne de charge ont le droit de toucher au
`montant` brut. Plus un test qui vérifie qu'une charge annuelle de 600 € contribue bien 50 € au
virement permanent — c'est le test qui rattrapera la faute si elle est commise plus tard.

Côté UI, le formulaire affiche **« par mois » ou « par an » directement sous le champ du montant**,
et l'unité change avec le sélecteur de type. C'est ce qui empêche l'erreur à la saisie.

### 8.2 Réorganisation : des flèches, pas du drag & drop

Des flèches ▲▼ en mode édition, sur les **comptes** et les **budgets** uniquement. Une heure de
travail contre une journée pour un glisser-déposer tactile correct, et pour trois comptes la
différence ne se voit pas.

### 8.3 Affichage du dernier reset

Une **date en clair**, pas une durée relative : `Dernier reset le 01/07/2025`.

Affiché à deux endroits :
- **Accueil** : une pilule discrète sous l'en-tête.
- **Réglages**, section Cycle : sous le bouton « Démarrer un nouveau cycle ».

C'est la parade au principal risque d'usage : si tu oublies d'appuyer début août, l'app affiche
sereinement l'état de juillet et tu te crois à jour.

### 8.4 Tri des charges

Deux écrans, deux tris, tous les deux **calculés** — d'où l'absence de champ `ordre` sur `Charge`.

| Écran | Tri |
|---|---|
| Détail d'un compte (checklist) | Par **jour de prélèvement** croissant |
| Liste « Mes charges » | Groupée par **type** : d'abord les mensuelles, puis les annuelles |

Dans la liste complète, un sélecteur permet de changer de groupement : **Par type** (défaut),
**Par compte**, **Par catégorie**. Chaque en-tête de groupe affiche son sous-total mensuel lissé.

### 8.5 Reporté en v2

- L'arrondi des virements permanents à l'euro supérieur.
- Tout le reste listé en §2, « Reporté après usage réel ».
