-- HamsterBudgeo — schéma initial
--
-- Conventions du projet :
--   • snake_case en base, camelCase dans le code, conversion explicite dans les SELECT
--   • tous les montants sont des ENTIERS en CENTIMES, jamais de type flottant
--   • aucun historique : l'application ne connaît que le cycle courant

CREATE TABLE foyer (
    id               SERIAL PRIMARY KEY,
    nom              TEXT        NOT NULL,
    mode_repartition TEXT        NOT NULL DEFAULT 'prorata_revenus'
                     CHECK (mode_repartition IN ('moitie', 'prorata_revenus', 'reste_a_vivre_egal')),
    dernier_reset    DATE        NOT NULL DEFAULT CURRENT_DATE,
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE personne (
    id                   SERIAL PRIMARY KEY,
    foyer_id             INTEGER NOT NULL REFERENCES foyer(id) ON DELETE CASCADE,
    prenom               TEXT    NOT NULL,
    -- En centimes, comme tout montant de la base.
    salaire_net_cents    INTEGER NOT NULL DEFAULT 0 CHECK (salaire_net_cents >= 0),
    couleur              TEXT    NOT NULL DEFAULT 'bleu',
    ordre                INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX personne_foyer_idx ON personne(foyer_id);

-- Un compte utilisateur est rattaché à une personne existante. C'est ce qui permet
-- de gérer le couple seul, puis d'inviter le conjoint sans migration de données.
CREATE TABLE utilisateur (
    id            SERIAL PRIMARY KEY,
    foyer_id      INTEGER     NOT NULL REFERENCES foyer(id) ON DELETE CASCADE,
    personne_id   INTEGER     UNIQUE REFERENCES personne(id) ON DELETE SET NULL,
    email         TEXT        NOT NULL UNIQUE,
    mot_de_passe  TEXT        NOT NULL,
    cree_le       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invitation (
    id          SERIAL PRIMARY KEY,
    foyer_id    INTEGER     NOT NULL REFERENCES foyer(id) ON DELETE CASCADE,
    personne_id INTEGER     NOT NULL REFERENCES personne(id) ON DELETE CASCADE,
    code        TEXT        NOT NULL UNIQUE,
    expire_le   TIMESTAMPTZ NOT NULL
);

CREATE TABLE categorie (
    id       SERIAL PRIMARY KEY,
    foyer_id INTEGER NOT NULL REFERENCES foyer(id) ON DELETE CASCADE,
    nom      TEXT    NOT NULL,
    icone    TEXT    NOT NULL,
    couleur  TEXT    NOT NULL,
    ordre    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX categorie_foyer_idx ON categorie(foyer_id);

-- Le rôle détermine ce que le compte contient et le comportement de son écran.
CREATE TABLE compte (
    id       SERIAL PRIMARY KEY,
    foyer_id INTEGER NOT NULL REFERENCES foyer(id) ON DELETE CASCADE,
    nom      TEXT    NOT NULL,
    banque   TEXT    NOT NULL DEFAULT '',
    role     TEXT    NOT NULL CHECK (role IN ('prelevements', 'courant', 'provisions')),
    couleur  TEXT    NOT NULL DEFAULT 'bleu',
    ordre    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX compte_foyer_idx ON compte(foyer_id);

-- ⚠️ `montant_cents` change d'unité selon `type` : par mois si mensuelle, PAR AN si
-- annuelle. Aucun code ne doit lire cette colonne directement pour un calcul : tout
-- passe par coutMensuelLisse() dans shared/calculs.ts.
CREATE TABLE charge (
    id               SERIAL PRIMARY KEY,
    compte_id        INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
    categorie_id     INTEGER          REFERENCES categorie(id) ON DELETE SET NULL,
    nom              TEXT    NOT NULL,
    type             TEXT    NOT NULL CHECK (type IN ('mensuelle', 'annuelle')),
    montant_cents    INTEGER NOT NULL CHECK (montant_cents >= 0),
    jour_prelevement INTEGER          CHECK (jour_prelevement BETWEEN 1 AND 31),
    est_prelevee     BOOLEAN NOT NULL DEFAULT FALSE,
    actif            BOOLEAN NOT NULL DEFAULT TRUE,

    -- Une charge annuelle est provisionnée, jamais cochée : elle n'a ni jour de
    -- prélèvement ni état. Cette contrainte rend l'incohérence impossible en base.
    CONSTRAINT charge_annuelle_sans_suivi CHECK (
        type <> 'annuelle' OR (jour_prelevement IS NULL AND est_prelevee = FALSE)
    )
);
CREATE INDEX charge_compte_idx ON charge(compte_id);

CREATE TABLE budget (
    id                    SERIAL PRIMARY KEY,
    compte_id             INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
    categorie_id          INTEGER          REFERENCES categorie(id) ON DELETE SET NULL,
    nom                   TEXT    NOT NULL,
    montant_mensuel_cents INTEGER NOT NULL CHECK (montant_mensuel_cents >= 0),
    ordre                 INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX budget_compte_idx ON budget(compte_id);

-- Vidée à chaque nouveau cycle : c'est le seul endroit qui pourrait ressembler à un
-- historique, et il n'en est pas un.
CREATE TABLE depense (
    id          SERIAL PRIMARY KEY,
    budget_id   INTEGER NOT NULL REFERENCES budget(id) ON DELETE CASCADE,
    personne_id INTEGER          REFERENCES personne(id) ON DELETE SET NULL,
    libelle     TEXT    NOT NULL,
    montant_cents INTEGER NOT NULL CHECK (montant_cents >= 0),
    date_depense  DATE  NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX depense_budget_idx ON depense(budget_id);
