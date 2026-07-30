import { sql } from './client.js'

export interface NouvelleDepense {
  /** Vide ou absent : le nom du budget est repris à la place. */
  libelle: string
  montantCents: number
  dateDepense: string
  personneId: number | null
}

/**
 * Ajoute une dépense à un budget.
 *
 * L'appartenance au foyer est vérifiée par la jointure du SELECT, pas par une requête
 * préalable : un budget d'un autre foyer ne produit simplement aucune ligne, donc
 * aucune insertion. Impossible d'écrire chez le voisin en devinant un identifiant.
 *
 * `personne_id` passe par une sous-requête filtrée sur le foyer : une personne
 * étrangère est ramenée à NULL au lieu d'être enregistrée telle quelle.
 *
 * Le libellé est facultatif : vide, il prend le nom du budget. Le repli se fait en SQL
 * plutôt que dans le code appelant, parce que le nom du budget est déjà dans la
 * jointure — inutile de le relire d'abord, et la règle vaut pour tout appelant.
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

/** Supprime une dépense du cycle courant. Même garde-fou par jointure. */
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
