import type { ModeRepartition } from '@hamsterbudgeo/shared/types.js'
import { sql } from './client.js'

/** `foyer_id` dans la clause WHERE : une personne d'un autre foyer est inatteignable. */
export async function modifierSalaire(
  foyerId: number,
  personneId: number,
  salaireNetCents: number,
): Promise<boolean> {
  const lignes = await sql`
    UPDATE personne
    SET salaire_net_cents = ${salaireNetCents}
    WHERE id = ${personneId} AND foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

/**
 * Le mode ne change aucun montant, il redistribue un total déjà connu : d'où sa place
 * sur le foyer plutôt que sur les charges.
 */
export async function definirModeRepartition(
  foyerId: number,
  mode: ModeRepartition,
): Promise<boolean> {
  const lignes = await sql`
    UPDATE foyer SET mode_repartition = ${mode} WHERE id = ${foyerId} RETURNING id
  `
  return lignes.length > 0
}
