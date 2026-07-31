import { sql } from './client.js'

export interface SaisieBudget {
  compteId: number
  categorieId: number | null
  nom: string
  montantMensuelCents: number
}

/**
 * Crée un budget.
 *
 * Comme pour les charges, le compte et la catégorie sont résolus par des sous-requêtes
 * filtrées sur le foyer : un compte étranger ne produit aucune ligne, une catégorie
 * étrangère est ramenée à NULL.
 */
export async function creerBudget(foyerId: number, saisie: SaisieBudget): Promise<boolean> {
  const lignes = await sql`
    INSERT INTO budget (compte_id, categorie_id, nom, montant_mensuel_cents, ordre)
    SELECT co.id,
           (SELECT ca.id FROM categorie ca WHERE ca.id = ${saisie.categorieId} AND ca.foyer_id = ${foyerId}),
           ${saisie.nom}, ${saisie.montantMensuelCents},
           (SELECT COALESCE(MAX(b.ordre) + 1, 0) FROM budget b
            JOIN compte c2 ON c2.id = b.compte_id WHERE c2.foyer_id = ${foyerId})
    FROM compte co
    WHERE co.id = ${saisie.compteId} AND co.foyer_id = ${foyerId}
    RETURNING id
  `
  return lignes.length > 0
}

/**
 * Modifie un budget.
 *
 * Les dépenses déjà saisies sont conservées, contrairement aux charges dont l'état
 * coché est remis à zéro : une dépense est un fait constaté, pas un état de suivi.
 * Baisser le plafond d'un budget déjà consommé le fait passer en dépassement, ce qui
 * est l'information juste.
 */
export async function modifierBudget(
  foyerId: number,
  budgetId: number,
  saisie: SaisieBudget,
): Promise<boolean> {
  const lignes = await sql`
    UPDATE budget b
    SET compte_id = (SELECT co.id FROM compte co WHERE co.id = ${saisie.compteId} AND co.foyer_id = ${foyerId}),
        categorie_id = (SELECT ca.id FROM categorie ca WHERE ca.id = ${saisie.categorieId} AND ca.foyer_id = ${foyerId}),
        nom = ${saisie.nom},
        montant_mensuel_cents = ${saisie.montantMensuelCents}
    FROM compte cible
    WHERE b.compte_id = cible.id AND b.id = ${budgetId} AND cible.foyer_id = ${foyerId}
    RETURNING b.id
  `
  return lignes.length > 0
}

/** Supprime un budget, et ses dépenses avec lui (`ON DELETE CASCADE`). */
export async function supprimerBudget(foyerId: number, budgetId: number): Promise<boolean> {
  const lignes = await sql`
    DELETE FROM budget b
    USING compte c
    WHERE b.compte_id = c.id AND b.id = ${budgetId} AND c.foyer_id = ${foyerId}
    RETURNING b.id
  `
  return lignes.length > 0
}
