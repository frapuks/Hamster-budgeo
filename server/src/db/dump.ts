import { sql } from './client.js'

/**
 * Lecture brute de tout le contenu d'un foyer, pour vérification manuelle.
 *
 * Route de développement uniquement : elle n'applique aucun calcul et n'a pas
 * vocation à alimenter l'interface. L'état calculé arrive au lot 2 avec GET /api/etat.
 */
export async function dumperFoyer(foyerId: number) {
  const [foyer] = await sql`
    SELECT id, nom, mode_repartition AS "modeRepartition", dernier_reset AS "dernierReset"
    FROM foyer WHERE id = ${foyerId}
  `

  const personnes = await sql`
    SELECT id, prenom, salaire_net_cents AS "salaireNetCents", couleur, ordre
    FROM personne WHERE foyer_id = ${foyerId} ORDER BY ordre
  `

  const categories = await sql`
    SELECT id, nom, icone, couleur, ordre
    FROM categorie WHERE foyer_id = ${foyerId} ORDER BY ordre
  `

  const comptes = await sql`
    SELECT id, nom, banque, role, couleur, ordre
    FROM compte WHERE foyer_id = ${foyerId} ORDER BY ordre
  `

  const charges = await sql`
    SELECT ch.id, ch.compte_id AS "compteId", ch.categorie_id AS "categorieId",
           ch.nom, ch.type, ch.montant_cents AS "montantCents",
           ch.jour_prelevement AS "jourPrelevement", ch.est_prelevee AS "estPrelevee", ch.actif
    FROM charge ch
    JOIN compte c ON c.id = ch.compte_id
    WHERE c.foyer_id = ${foyerId}
    ORDER BY ch.compte_id, ch.jour_prelevement NULLS LAST, ch.id
  `

  const budgets = await sql`
    SELECT b.id, b.compte_id AS "compteId", b.categorie_id AS "categorieId",
           b.nom, b.montant_mensuel_cents AS "montantMensuelCents", b.ordre
    FROM budget b
    JOIN compte c ON c.id = b.compte_id
    WHERE c.foyer_id = ${foyerId}
    ORDER BY b.ordre
  `

  const depenses = await sql`
    SELECT d.id, d.budget_id AS "budgetId", d.personne_id AS "personneId",
           d.libelle, d.montant_cents AS "montantCents", d.date_depense AS "dateDepense"
    FROM depense d
    JOIN budget b ON b.id = d.budget_id
    JOIN compte c ON c.id = b.compte_id
    WHERE c.foyer_id = ${foyerId}
    ORDER BY d.date_depense, d.id
  `

  return { foyer, personnes, categories, comptes, charges, budgets, depenses }
}

/** Identifiant du foyer courant. Codé en dur jusqu'au lot 11 (authentification). */
export async function foyerCourant(): Promise<number | null> {
  const [ligne] = await sql<{ id: number }[]>`SELECT id FROM foyer ORDER BY id LIMIT 1`
  return ligne?.id ?? null
}
