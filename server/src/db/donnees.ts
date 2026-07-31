import { sql } from './client.js'

/**
 * Vide le contenu budgétaire du foyer. Les personnes et leurs salaires survivent :
 * effacer ses comptes ne doit pas obliger à les ressaisir.
 */
export async function viderFoyer(foyerId: number): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM compte WHERE foyer_id = ${foyerId}`
    await tx`DELETE FROM categorie WHERE foyer_id = ${foyerId}`
    await tx`UPDATE foyer SET dernier_reset = CURRENT_DATE WHERE id = ${foyerId}`
  })
}
