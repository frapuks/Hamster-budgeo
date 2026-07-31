import { sql } from './client.js'

export interface NouvelleDepense {
  /** Vide ou absent : le nom du budget est repris à la place. */
  libelle: string
  montantCents: number
  dateDepense: string
  personneId: number | null
}

/**
 * L'appartenance au foyer passe par la jointure : un budget étranger ne produit aucune
 * ligne, donc aucune insertion.
 *
 * Libellé vide : le nom du budget est repris. Le repli se fait en SQL parce que ce nom
 * est déjà dans la jointure, et que la règle vaut alors pour tout appelant.
 */
export async function ajouterDepense(
  foyerId: number,
  budgetId: number,
  depense: NouvelleDepense,
): Promise<boolean> {
  const lignes = await sql`
    INSERT INTO depense (budget_id, personne_id, libelle, montant_cents, date_depense)
    SELECT b.id,
           (SELECT p.id FROM personne p WHERE p.id = ${depense.personneId} AND p.foyer_id = ${foyerId}),
           COALESCE(NULLIF(TRIM(${depense.libelle}), ''), b.nom),
           ${depense.montantCents},
           ${depense.dateDepense}
    FROM budget b
    JOIN compte c ON c.id = b.compte_id
    WHERE b.id = ${budgetId} AND c.foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

/** Même garde-fou par jointure. */
export async function supprimerDepense(foyerId: number, depenseId: number): Promise<boolean> {
  const lignes = await sql`
    DELETE FROM depense d
    USING budget b, compte c
    WHERE d.budget_id = b.id
      AND b.compte_id = c.id
      AND d.id = ${depenseId}
      AND c.foyer_id = ${foyerId}
    RETURNING d.id
  `
  return lignes.length > 0
}
