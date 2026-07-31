-- Sessions de connexion.
--
-- Le jeton n'est jamais stocké en clair : seule son empreinte SHA-256 est enregistrée.
-- Une fuite de la base ne permet donc pas de rejouer une session existante.

CREATE TABLE session (
    id             SERIAL PRIMARY KEY,
    utilisateur_id INTEGER     NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    jeton_hash     TEXT        NOT NULL UNIQUE,
    expire_le      TIMESTAMPTZ NOT NULL,
    cree_le        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX session_utilisateur_idx ON session(utilisateur_id);
CREATE INDEX session_expiration_idx ON session(expire_le);
