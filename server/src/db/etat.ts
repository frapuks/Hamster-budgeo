import { assemblerEtat } from '@hamsterbudgeo/shared/calculs.js'
import type {
  Budget,
  Categorie,
  Charge,
  Depense,
  EtatFoyer,
  ModeRepartition,
  Personne,
  RoleCompte,
} from '@hamsterbudgeo/shared/types.js'
import { sql } from './client.js'

/**
 * Objet renvoyé par GET /api/etat et par chaque mutation : le front écrase son cache
 * avec la réponse, sans jamais avoir d'invalidation à gérer.
 */
export async function lireEtat(foyerId: number): Promise<EtatFoyer | null> {
  const [foyer] = await sql<
    { id: number; nom: string; modeRepartition: ModeRepartition; dernierReset: Date }[]
  >`
    SELECT id, nom, mode_repartition AS "modeRepartition", dernier_reset AS "dernierReset"
    FROM foyer WHERE id = ${foyerId}
  `
  if (!foyer) return null

  const personnes = await sql<Personne[]>`
    SELECT id, prenom, salaire_net_cents AS "salaireNetCents", couleur
    FROM personne WHERE foyer_id = ${foyerId} ORDER BY ordre, id
  `

  const categories = await sql<Categorie[]>`
    SELECT id, nom, icone, couleur
    FROM categorie WHERE foyer_id = ${foyerId} ORDER BY ordre, id
  `
  const parId = new Map(categories.map((c) => [c.id, c]))

  const comptes = await sql<
    { id: number; nom: string; banque: string; role: RoleCompte; couleur: string; ordre: number }[]
  >`
    SELECT id, nom, banque, role, couleur, ordre
    FROM compte WHERE foyer_id = ${foyerId} ORDER BY ordre, id
  `

  const lignesCharges = await sql<(Omit<Charge, 'categorie'> & { categorieId: number | null })[]>`
    SELECT ch.id, ch.compte_id AS "compteId", ch.categorie_id AS "categorieId", ch.nom, ch.type,
           ch.montant_cents AS "montantCents", ch.jour_prelevement AS "jourPrelevement",
           ch.est_prelevee AS "estPrelevee", ch.actif
    FROM charge ch
    JOIN compte c ON c.id = ch.compte_id
    WHERE c.foyer_id = ${foyerId}
    ORDER BY ch.jour_prelevement NULLS LAST, ch.id
  `

  const lignesBudgets = await sql<
    { id: number; compteId: number; categorieId: number | null; nom: string; montantMensuelCents: number; ordre: number }[]
  >`
    SELECT b.id, b.compte_id AS "compteId", b.categorie_id AS "categorieId", b.nom,
           b.montant_mensuel_cents AS "montantMensuelCents", b.ordre
    FROM budget b
    JOIN compte c ON c.id = b.compte_id
    WHERE c.foyer_id = ${foyerId}
    ORDER BY b.ordre, b.id
  `

  const lignesDepenses = await sql<Depense[]>`
    SELECT d.id, d.budget_id AS "budgetId", d.personne_id AS "personneId", d.libelle,
           d.montant_cents AS "montantCents", d.date_depense AS "dateDepense"
    FROM depense d
    JOIN budget b ON b.id = d.budget_id
    JOIN compte c ON c.id = b.compte_id
    WHERE c.foyer_id = ${foyerId}
    ORDER BY d.date_depense DESC, d.id DESC
  `

  const charges: Charge[] = lignesCharges.map(({ categorieId, ...c }) => ({
    ...c,
    categorie: categorieId === null ? null : (parId.get(categorieId) ?? null),
  }))

  const budgets: Budget[] = lignesBudgets.map(({ categorieId, ...b }) => ({
    ...b,
    categorie: categorieId === null ? null : (parId.get(categorieId) ?? null),
    depenses: lignesDepenses.filter((d) => d.budgetId === b.id),
  }))

  return assemblerEtat({
    foyer: {
      id: foyer.id,
      nom: foyer.nom,
      modeRepartition: foyer.modeRepartition,
      // `date` PostgreSQL revient en objet Date : on ne garde que le jour, sans fuseau.
      dernierReset: formaterDateIso(foyer.dernierReset),
    },
    personnes,
    categories,
    comptes: comptes.map((compte) => ({
      ...compte,
      charges: charges.filter((c) => c.compteId === compte.id),
      budgets: budgets.filter((b) => b.compteId === compte.id),
    })),
  })
}

/**
 * `YYYY-MM-DD` en heure locale. `toISOString()` convertirait en UTC et pourrait reculer
 * d'un jour, affichant « 30 juin » pour un 1er juillet.
 */
function formaterDateIso(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${jour}`
}

/** Premier foyer de la base. Utilisé par `npm run seed`, hors contexte de session. */
export async function foyerCourant(): Promise<number | null> {
  const [ligne] = await sql<{ id: number }[]>`SELECT id FROM foyer ORDER BY id LIMIT 1`
  return ligne?.id ?? null
}
