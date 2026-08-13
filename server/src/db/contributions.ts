import { sql } from './client.js'
import type { Contribution } from '@hamsterbudgeo/shared/types.js'

/**
 * Enregistre les montants versés, en une transaction.
 *
 * Les deux appartenances au foyer sont vérifiées par la sous-requête d'insertion :
 * une ligne dont la personne ou le compte relève d'un autre foyer n'insère rien, sans
 * qu'il faille un contrôle préalable.
 */
export async function enregistrerContributions(
  foyerId: number,
  contributions: Contribution[],
): Promise<void> {
  if (contributions.length === 0) return

  await sql.begin(async (tx) => {
    for (const { personneId, compteId, montantCents } of contributions) {
      await tx`
        INSERT INTO contribution (personne_id, compte_id, montant_cents)
        SELECT p.id, c.id, ${montantCents}
        FROM personne p, compte c
        WHERE p.id = ${personneId} AND p.foyer_id = ${foyerId}
          AND c.id = ${compteId} AND c.foyer_id = ${foyerId}
        ON CONFLICT (personne_id, compte_id)
        DO UPDATE SET montant_cents = EXCLUDED.montant_cents
      `
    }
  })
}
