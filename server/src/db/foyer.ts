import type { ModeRepartition } from '@shared/types.js'
import { sql } from './client.js'

/**
 * Enregistre le salaire net mensuel d'une personne.
 *
 * Le `foyer_id` est dans la clause WHERE : une personne d'un autre foyer est
 * inatteignable même si son identifiant est deviné.
 */
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
 * Choisit le mode de répartition du foyer.
 *
 * Le mode ne change aucun montant : il ne fait que redistribuer un total déjà connu
 * entre les deux personnes. C'est pour ça qu'il vit sur le foyer et non sur les charges.
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
