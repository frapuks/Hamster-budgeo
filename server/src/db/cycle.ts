import { moisDuCycle } from '@hamsterbudgeo/shared/calculs.js'
import { sql, type Transaction } from './client.js'

/**
 * Copie le cycle qui s'achève dans les tables d'archive.
 *
 * Appelée dans la transaction du reset, avant l'effacement : c'est le seul instant où
 * l'on sait encore ce que le cycle contenait. Le mois peut être imposé par l'appelant,
 * pour les cas que la règle du milieu tranche mal.
 */
async function archiverCycle(tx: Transaction, foyerId: number, mois?: string): Promise<void> {
  const [foyer] = await tx<{ debut: string }[]>`
    SELECT to_char(dernier_reset, 'YYYY-MM-DD') AS debut FROM foyer WHERE id = ${foyerId}
  `
  if (!foyer) return

  const [aujourdhui] = await tx<{ jour: string }[]>`
    SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS jour
  `
  const fin = aujourdhui!.jour

  const [cycle] = await tx<{ id: number }[]>`
    INSERT INTO cycle_archive (foyer_id, mois, debut, fin)
    VALUES (${foyerId}, ${mois ?? moisDuCycle(foyer.debut, fin)}, ${foyer.debut}, ${fin})
    RETURNING id
  `

  // Le total est recopié plutôt que recalculé à la lecture : l'archive est immuable, et
  // ça garde la requête du graphique à une seule table.
  const budgets = await tx<{ id: number; budgetId: number }[]>`
    INSERT INTO budget_archive (cycle_archive_id, budget_id, nom, plafond_cents, depense_cents)
    SELECT ${cycle!.id}, b.id, b.nom, b.montant_mensuel_cents,
           COALESCE((SELECT SUM(d.montant_cents) FROM depense d WHERE d.budget_id = b.id), 0)
    FROM budget b
    JOIN compte c ON c.id = b.compte_id
    WHERE c.foyer_id = ${foyerId}
    RETURNING id, budget_id AS "budgetId"
  `

  for (const { id, budgetId } of budgets) {
    await tx`
      INSERT INTO depense_archive (budget_archive_id, libelle, montant_cents, date_depense)
      SELECT ${id}, d.libelle, d.montant_cents, d.date_depense
      FROM depense d
      WHERE d.budget_id = ${budgetId}
    `
  }
}

/**
 * Seule opération destructive de l'application. La transaction est indispensable : un
 * reset à moitié appliqué laisserait des charges décochées avec les dépenses de
 * l'ancien cycle, sans aucun moyen de rattrapage faute d'historique.
 */
export async function demarrerNouveauCycle(foyerId: number, mois?: string): Promise<void> {
  await sql.begin(async (tx) => {
    await archiverCycle(tx, foyerId, mois)

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
