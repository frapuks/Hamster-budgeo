import { sql } from './client.js'

/**
 * Coche ou décoche une charge mensuelle.
 *
 * Le `foyerId` fait partie de la clause WHERE et n'est pas une simple vérification
 * préalable : une charge d'un autre foyer ne peut pas être atteinte, même si son
 * identifiant est deviné. Le middleware du lot 11 remplira ce paramètre depuis la
 * session ; d'ici là il vient du foyer courant.
 *
 * Le filtre `type = 'mensuelle'` reflète la règle métier : une charge annuelle est
 * provisionnée, jamais cochée. La contrainte SQL `charge_annuelle_sans_suivi` le
 * garantit aussi côté base — ceci n'est qu'un garde-fou de plus, qui produit une
 * erreur 404 lisible plutôt qu'une violation de contrainte.
 */
export async function cocherCharge(
  foyerId: number,
  chargeId: number,
  estPrelevee: boolean,
): Promise<boolean> {
  const lignes = await sql`
    UPDATE charge ch
    SET est_prelevee = ${estPrelevee}
    FROM compte c
    WHERE ch.compte_id = c.id
      AND ch.id = ${chargeId}
      AND c.foyer_id = ${foyerId}
      AND ch.type = 'mensuelle'
    RETURNING ch.id
  `
  return lignes.length > 0
}
