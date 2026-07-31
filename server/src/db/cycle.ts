import { sql } from './client.js'

/**
 * Démarre un nouveau cycle.
 *
 * C'est la seule opération destructive de l'application, et elle tient en trois
 * requêtes — c'est le dividende de la décision « pas d'historique ». Elle décoche les
 * charges, efface les dépenses du cycle, et date le nouveau départ.
 *
 * Le tout dans une transaction : un reset à moitié appliqué laisserait des charges
 * décochées avec les dépenses de l'ancien cycle, un état incohérent que rien ne
 * permettrait de rattraper puisqu'il n'y a pas d'historique.
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
