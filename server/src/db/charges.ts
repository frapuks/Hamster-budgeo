import type { TypeCharge } from '@hamsterbudgeo/shared/types.js'
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
 * Une charge annuelle est provisionnée, jamais cochée : ni jour de prélèvement ni état.
 * La contrainte SQL le refuserait, mais mieux vaut nettoyer ici que renvoyer une erreur
 * de base à qui bascule simplement le type d'une charge.
 */
function normaliser(saisie: SaisieCharge) {
  return {
    ...saisie,
    jourPrelevement: saisie.type === 'annuelle' ? null : saisie.jourPrelevement,
    estPrelevee: false,
  }
}

/**
 * Le `foyerId` est dans la clause WHERE, pas dans une vérification préalable : une
 * charge d'un autre foyer est inatteignable même si son identifiant est deviné.
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
 * Compte et catégorie résolus par des sous-requêtes filtrées sur le foyer : un compte
 * étranger ne produit aucune ligne, une catégorie étrangère est ramenée à NULL.
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
 * L'état coché repart à faux : après un changement de montant ou de type, le
 * prélèvement passé ne correspond plus à ce qui est décrit.
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
