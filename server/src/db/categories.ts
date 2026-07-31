import { sql } from './client.js'

export interface SaisieCategorie {
  nom: string
  icone: string
  couleur: string
}

export async function creerCategorie(
  foyerId: number,
  saisie: SaisieCategorie,
): Promise<boolean> {
  const lignes = await sql`
    INSERT INTO categorie (foyer_id, nom, icone, couleur, ordre)
    SELECT ${foyerId}, ${saisie.nom}, ${saisie.icone}, ${saisie.couleur},
           COALESCE(MAX(ordre) + 1, 0)
    FROM categorie WHERE foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

/**
 * Les charges et budgets concernés passent à `categorie_id NULL` : perdre un classement
 * ne doit jamais faire perdre un montant.
 */
export async function supprimerCategorie(foyerId: number, categorieId: number): Promise<boolean> {
  const lignes = await sql`
    DELETE FROM categorie WHERE id = ${categorieId} AND foyer_id = ${foyerId} RETURNING id
  `
  return lignes.length > 0
}
