import type { TypeCharge } from '@shared/types.js'
import { sql } from './client.js'

export interface SaisieCharge {
  compteId: number
  categorieId: number | null
  nom: string
  type: TypeCharge
  /** Par mois si `mensuelle`, PAR AN si `annuelle`. */
  montantCents: number
  jourPrelevement: number | null
}

/**
 * Normalise une saisie avant écriture.
 *
 * Une charge annuelle est provisionnée, jamais cochée : elle n'a ni jour de
 * prélèvement ni état. La contrainte `charge_annuelle_sans_suivi` le refuserait en
 * base, mais mieux vaut nettoyer ici que renvoyer une erreur SQL à l'utilisateur qui
 * bascule simplement le type d'une charge existante.
 */
function normaliser(saisie: SaisieCharge) {
  return {
    ...saisie,
    jourPrelevement: saisie.type === 'annuelle' ? null : saisie.jourPrelevement,
    estPrelevee: false,
  }
}

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

/**
 * Crée une charge.
 *
 * Le compte et la catégorie sont résolus par des sous-requêtes filtrées sur le foyer :
 * un compte étranger ne produit aucune ligne (donc aucune création), et une catégorie
 * étrangère est ramenée à NULL au lieu d'être enregistrée.
 */
export async function creerCharge(foyerId: number, saisie: SaisieCharge): Promise<boolean> {
  const c = normaliser(saisie)
  const lignes = await sql`
    INSERT INTO charge (compte_id, categorie_id, nom, type, montant_cents, jour_prelevement, est_prelevee, actif)
    SELECT co.id,
           (SELECT ca.id FROM categorie ca WHERE ca.id = ${c.categorieId} AND ca.foyer_id = ${foyerId}),
           ${c.nom}, ${c.type}, ${c.montantCents}, ${c.jourPrelevement}, ${c.estPrelevee}, TRUE
    FROM compte co
    WHERE co.id = ${c.compteId} AND co.foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

/**
 * Modifie une charge.
 *
 * L'état coché est remis à faux : changer le montant, le type ou le compte d'une charge
 * déjà cochée rendrait son état ambigu — le prélèvement passé ne correspond plus à ce
 * qui est décrit. Repartir de « à venir » est le comportement le moins surprenant.
 */
export async function modifierCharge(
  foyerId: number,
  chargeId: number,
  saisie: SaisieCharge,
): Promise<boolean> {
  const c = normaliser(saisie)
  const lignes = await sql`
    UPDATE charge ch
    SET compte_id = (SELECT co.id FROM compte co WHERE co.id = ${c.compteId} AND co.foyer_id = ${foyerId}),
        categorie_id = (SELECT ca.id FROM categorie ca WHERE ca.id = ${c.categorieId} AND ca.foyer_id = ${foyerId}),
        nom = ${c.nom},
        type = ${c.type},
        montant_cents = ${c.montantCents},
        jour_prelevement = ${c.jourPrelevement},
        est_prelevee = ${c.estPrelevee}
    FROM compte cible
    WHERE ch.compte_id = cible.id
      AND ch.id = ${chargeId}
      AND cible.foyer_id = ${foyerId}
    RETURNING ch.id
  `
  return lignes.length > 0
}

export async function supprimerCharge(foyerId: number, chargeId: number): Promise<boolean> {
  const lignes = await sql`
    DELETE FROM charge ch
    USING compte c
    WHERE ch.compte_id = c.id AND ch.id = ${chargeId} AND c.foyer_id = ${foyerId}
    RETURNING ch.id
  `
  return lignes.length > 0
}
