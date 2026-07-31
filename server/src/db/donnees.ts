import { sql } from './client.js'

/**
 * Vide le foyer de son contenu, sans le détruire.
 *
 * Les comptes partent en cascade avec leurs charges, budgets et dépenses. Le foyer et
 * les personnes survivent : effacer ses comptes ne doit pas obliger à ressaisir les
 * prénoms et les salaires, qui n'ont rien à voir avec la structure budgétaire.
 */
export async function viderFoyer(foyerId: number): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM compte WHERE foyer_id = ${foyerId}`
    await tx`DELETE FROM categorie WHERE foyer_id = ${foyerId}`
    await tx`UPDATE foyer SET dernier_reset = CURRENT_DATE WHERE id = ${foyerId}`
  })
}
