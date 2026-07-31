import type { RoleCompte } from '@shared/types.js'
import { sql } from './client.js'

export interface SaisieCompte {
  nom: string
  banque: string
  role: RoleCompte
  couleur: string
}

export async function creerCompte(foyerId: number, saisie: SaisieCompte): Promise<boolean> {
  const lignes = await sql`
    INSERT INTO compte (foyer_id, nom, banque, role, couleur, ordre)
    SELECT ${foyerId}, ${saisie.nom}, ${saisie.banque}, ${saisie.role}, ${saisie.couleur},
           COALESCE(MAX(ordre) + 1, 0)
    FROM compte WHERE foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

export async function modifierCompte(
  foyerId: number,
  compteId: number,
  saisie: SaisieCompte,
): Promise<boolean> {
  const lignes = await sql`
    UPDATE compte
    SET nom = ${saisie.nom}, banque = ${saisie.banque}, role = ${saisie.role},
        couleur = ${saisie.couleur}
    WHERE id = ${compteId} AND foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

/**
 * Supprime un compte, et avec lui ses charges, ses budgets et leurs dépenses
 * (`ON DELETE CASCADE`). C'est la suppression la plus lourde de l'application : c'est à
 * l'interface d'annoncer précisément ce qui va disparaître.
 */
export async function supprimerCompte(foyerId: number, compteId: number): Promise<boolean> {
  const lignes = await sql`
    DELETE FROM compte WHERE id = ${compteId} AND foyer_id = ${foyerId} RETURNING id
  `
  return lignes.length > 0
}

/**
 * Réordonne les comptes d'après la liste d'identifiants reçue.
 *
 * On réécrit tous les rangs plutôt que d'échanger deux lignes : c'est une seule requête,
 * et surtout ça répare au passage d'éventuels rangs en double ou manquants. Les
 * identifiants étrangers au foyer sont ignorés par la clause WHERE.
 */
export async function reordonnerComptes(foyerId: number, ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await sql.begin(async (tx) => {
    for (const [rang, id] of ids.entries()) {
      await tx`UPDATE compte SET ordre = ${rang} WHERE id = ${id} AND foyer_id = ${foyerId}`
    }
  })
}
