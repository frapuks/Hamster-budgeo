import { sql } from './client.js'
import type { MoisBudget } from '@hamsterbudgeo/shared/types.js'

/**
 * Les mois clos d'un budget, du plus ancien au plus récent.
 *
 * Le cloisonnement passe par `cycle_archive.foyer_id` et non par le compte : un budget
 * supprimé garde son historique, et n'a donc plus de compte par lequel le joindre.
 */
export async function historiqueBudget(
  foyerId: number,
  budgetId: number,
  limite = 12,
): Promise<MoisBudget[]> {
  const lignes = await sql<MoisBudget[]>`
    SELECT to_char(ca.mois, 'YYYY-MM-DD') AS mois,
           to_char(ca.debut, 'YYYY-MM-DD') AS debut,
           to_char(ca.fin, 'YYYY-MM-DD') AS fin,
           ba.nom,
           ba.plafond_cents AS "plafondCents",
           ba.depense_cents AS "depenseCents"
    FROM budget_archive ba
    JOIN cycle_archive ca ON ca.id = ba.cycle_archive_id
    WHERE ba.budget_id = ${budgetId} AND ca.foyer_id = ${foyerId}
    ORDER BY ca.mois DESC
    LIMIT ${limite}
  `
  return lignes.reverse()
}
