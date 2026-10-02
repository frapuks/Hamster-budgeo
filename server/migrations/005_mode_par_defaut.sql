-- Le partage moitié-moitié devient le mode par défaut d'un nouveau foyer.
--
-- Seule la valeur par défaut change : les foyers existants gardent le mode qu'ils ont
-- choisi, y compris ceux restés sur l'ancien défaut.

ALTER TABLE foyer ALTER COLUMN mode_repartition SET DEFAULT 'moitie';
