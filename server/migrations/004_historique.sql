-- Archive des cycles clos.
--
-- L'application ne garde aucun historique de son état courant ; ces tables sont la seule
-- exception, et elles sont en écriture unique : le reset y copie le cycle qui s'achève,
-- puis rien ne les modifie jamais. Aucun calcul courant ne les lit.

CREATE TABLE cycle_archive (
    id       SERIAL  PRIMARY KEY,
    foyer_id INTEGER NOT NULL REFERENCES foyer(id) ON DELETE CASCADE,
    -- Premier jour du mois auquel le cycle est rattaché. Un cycle du 31 août au 1er
    -- octobre compte pour septembre : c'est le mois qui contient son milieu.
    mois     DATE    NOT NULL,
    debut    DATE    NOT NULL,
    fin      DATE    NOT NULL,
    cree_le  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cycle_archive_foyer_idx ON cycle_archive(foyer_id, mois);

-- Un budget tel qu'il était à la clôture, avec son total. Une ligne même sans dépense :
-- sans elle, un mois sans restaurant ferait un trou dans le graphique au lieu d'un zéro.
CREATE TABLE budget_archive (
    id               SERIAL  PRIMARY KEY,
    cycle_archive_id INTEGER NOT NULL REFERENCES cycle_archive(id) ON DELETE CASCADE,
    -- Volontairement sans clé étrangère : c'est ce qui permet à l'historique de survivre
    -- à la suppression du budget. Les identifiants ne sont jamais réattribués, la série
    -- reste donc intacte, et un budget renommé garde la sienne.
    budget_id        INTEGER NOT NULL,
    nom              TEXT    NOT NULL,
    plafond_cents    INTEGER NOT NULL,
    depense_cents    INTEGER NOT NULL
);

CREATE INDEX budget_archive_budget_idx ON budget_archive(budget_id);

CREATE TABLE depense_archive (
    id                SERIAL  PRIMARY KEY,
    budget_archive_id INTEGER NOT NULL REFERENCES budget_archive(id) ON DELETE CASCADE,
    libelle           TEXT    NOT NULL,
    montant_cents     INTEGER NOT NULL,
    date_depense      DATE    NOT NULL
);

CREATE INDEX depense_archive_budget_idx ON depense_archive(budget_archive_id);
