-- Ce que chaque personne verse réellement sur chaque compte.
--
-- Distinct de la répartition calculée : celle-ci dit ce que chacun devrait payer au
-- total, alors qu'un virement permanent se paramètre compte par compte. L'écart entre
-- les deux est précisément ce que la page du couple donne à voir.
--
-- Pas de colonne foyer : elle se déduit des deux références, toutes deux contraintes au
-- même foyer par les requêtes.

CREATE TABLE contribution (
    personne_id   INTEGER NOT NULL REFERENCES personne(id) ON DELETE CASCADE,
    compte_id     INTEGER NOT NULL REFERENCES compte(id) ON DELETE CASCADE,
    montant_cents INTEGER NOT NULL CHECK (montant_cents >= 0),
    PRIMARY KEY (personne_id, compte_id)
);

CREATE INDEX contribution_compte_idx ON contribution(compte_id);
