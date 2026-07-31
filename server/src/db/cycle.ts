import { sql } from './client.js'

/**
 * Seule opération destructive de l'application. La transaction est indispensable : un
 * reset à moitié appliqué laisserait des charges décochées avec les dépenses de
 * l'ancien cycle, sans aucun moyen de rattrapage faute d'historique.
 */
export async function demarrerNouveauCycle(foyerId: number): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`
      UPDATE charge ch
      SET est_prelevee = FALSE
      FROM compte c
      WHERE ch.compte_id = c.id AND c.foyer_id = ${foyerId} AND ch.est_prelevee
    `

    await tx`
      DELETE FROM depense d
      USING budget b, compte c
      WHERE d.budget_id = b.id AND b.compte_id = c.id AND c.foyer_id = ${foyerId}
    `

    await tx`UPDATE foyer SET dernier_reset = CURRENT_DATE WHERE id = ${foyerId}`
  })
}
