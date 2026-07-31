import { fileURLToPath } from 'node:url'
import { sql } from './db/client.js'

/**
 * Jeu de données de démonstration.
 *
 * Reprend au centime près le jeu de la spec (§7 du plan). Il sert trois usages :
 * l'onboarding au premier lancement, la fixture de développement, et le jeu
 * d'assertions des tests — d'où l'importance que les totaux tombent juste.
 *
 * Totaux attendus :
 *   • Compte prélèvements : 1 458,76 € · coché 207,21 € · reste 1 251,55 €
 *   • Compte carte        :   115,25 € · coché  14,98 € · reste   100,27 €
 *   • Budgets             : 1 170,00 € · dépensé 712,00 € · restant 458,00 €
 *   • Provisions          : 1 470,00 €/an · 122,50 €/mois
 *   • Virements permanents: 1 458,76 + 1 285,25 + 122,50 = 2 866,51 €/mois
 */

const CATEGORIES = [
  { nom: 'Logement', icone: 'maison', couleur: 'bleu' },
  { nom: 'Énergie', icone: 'eclair', couleur: 'ambre' },
  { nom: 'Eau', icone: 'goutte', couleur: 'turquoise' },
  { nom: 'Télécom', icone: 'wifi', couleur: 'turquoise' },
  { nom: 'Assurance', icone: 'bouclier', couleur: 'ardoise' },
  { nom: 'Santé', icone: 'coeur', couleur: 'corail' },
  { nom: 'Abonnements', icone: 'lecture', couleur: 'violet' },
  { nom: 'Transport', icone: 'voiture', couleur: 'bleu' },
  { nom: 'Impôts', icone: 'banque', couleur: 'ardoise' },
  { nom: 'Sport', icone: 'halteres', couleur: 'violet' },
  { nom: 'Alimentation', icone: 'panier', couleur: 'citron' },
  { nom: 'Restaurants', icone: 'restaurant', couleur: 'corail' },
  { nom: 'Loisirs', icone: 'etoile', couleur: 'violet' },
  { nom: 'Déchets', icone: 'poubelle', couleur: 'ardoise' },
  { nom: 'Véhicule', icone: 'cle', couleur: 'ambre' },
] as const

type NomCategorie = (typeof CATEGORIES)[number]['nom']

const CHARGES_PRELEVEMENTS = [
  { nom: 'Netflix', cents: 1349, jour: 2, prelevee: true, cat: 'Abonnements' },
  { nom: 'EDF', cents: 9640, jour: 5, prelevee: true, cat: 'Énergie' },
  { nom: 'Mutuelle', cents: 9732, jour: 8, prelevee: true, cat: 'Santé' },
  { nom: 'Loyer', cents: 85000, jour: 10, prelevee: false, cat: 'Logement' },
  { nom: 'Assurance habitation', cents: 3490, jour: 12, prelevee: false, cat: 'Assurance' },
  { nom: 'Internet', cents: 3999, jour: 15, prelevee: false, cat: 'Télécom' },
  { nom: 'Téléphone', cents: 1999, jour: 18, prelevee: false, cat: 'Télécom' },
  { nom: 'Assurance auto', cents: 6230, jour: 20, prelevee: false, cat: 'Assurance' },
  { nom: 'Impôt sur le revenu', cents: 24437, jour: 25, prelevee: false, cat: 'Impôts' },
] satisfies { nom: string; cents: number; jour: number; prelevee: boolean; cat: NomCategorie }[]

const CHARGES_COURANT = [
  { nom: 'Salle de sport', cents: 2900, jour: 3, prelevee: false, cat: 'Sport' },
  { nom: 'Spotify', cents: 1199, jour: 4, prelevee: true, cat: 'Abonnements' },
  { nom: 'iCloud', cents: 299, jour: 6, prelevee: true, cat: 'Abonnements' },
  { nom: 'Assurance téléphone', cents: 899, jour: 14, prelevee: false, cat: 'Assurance' },
  { nom: 'Abonnement transport', cents: 6228, jour: 20, prelevee: false, cat: 'Transport' },
] satisfies { nom: string; cents: number; jour: number; prelevee: boolean; cat: NomCategorie }[]

/** Montants ANNUELS : divisibles par 12 pour que la provision tombe juste. */
const CHARGES_PROVISIONS = [
  { nom: 'Eau', cents: 60000, cat: 'Eau' },
  { nom: 'Ordures ménagères', cents: 30000, cat: 'Déchets' },
  { nom: 'Entretien voiture', cents: 45000, cat: 'Véhicule' },
  { nom: 'Ramonage chaudière', cents: 12000, cat: 'Logement' },
] satisfies { nom: string; cents: number; cat: NomCategorie }[]

const BUDGETS = [
  {
    nom: 'Courses',
    cents: 40000,
    cat: 'Alimentation',
    depenses: [
      { libelle: 'Carrefour', cents: 12450, jour: 2 },
      { libelle: 'Marché', cents: 3800, jour: 4 },
      { libelle: 'Lidl', cents: 8930, jour: 6 },
      { libelle: 'Boulangerie', cents: 1620, jour: 7 },
      { libelle: 'Carrefour', cents: 4400, jour: 8 },
    ],
  },
  {
    nom: 'Essence',
    cents: 40000,
    cat: 'Transport',
    depenses: [{ libelle: 'Total Wasquehal', cents: 7800, jour: 5 }],
  },
  {
    nom: 'Restaurants',
    cents: 25000,
    cat: 'Restaurants',
    depenses: [
      { libelle: 'Le Bistrot', cents: 6800, jour: 3 },
      { libelle: 'Pizzeria', cents: 4250, jour: 6 },
      { libelle: 'Brunch', cents: 7950, jour: 8 },
    ],
  },
  {
    nom: 'Loisirs',
    cents: 12000,
    cat: 'Loisirs',
    depenses: [
      { libelle: 'Cinéma', cents: 2400, jour: 4 },
      { libelle: 'Concert', cents: 8900, jour: 7 },
      { libelle: 'Librairie', cents: 1900, jour: 8 },
    ],
  },
] satisfies {
  nom: string
  cents: number
  cat: NomCategorie
  depenses: { libelle: string; cents: number; jour: number }[]
}[]

const DEBUT_CYCLE = '2025-07-01'

/**
 * Charge le jeu de démonstration.
 *
 * Deux usages, volontairement distincts :
 *
 *  • `semer()` sans argument — la commande `npm run seed` : remet toute la base à zéro,
 *    comptes utilisateurs compris. Réservé au développement.
 *  • `semer(foyerId)` — le bouton « Charger la démonstration » : remplace le contenu
 *    budgétaire du foyer visé sans supprimer ni les personnes ni les comptes
 *    utilisateurs. Sans cette distinction, charger la démo depuis l'application
 *    déconnecterait les deux membres du foyer et détruirait leurs identifiants.
 */
export async function semer(foyerIdCible?: number): Promise<{ foyerId: number }> {
  return sql.begin(async (tx) => {
    if (foyerIdCible === undefined) {
      // Table par table plutôt qu'un TRUNCATE global : on ne touche pas à
      // schema_migrations, et l'ordre respecte les clés étrangères.
      await tx`TRUNCATE depense, budget, charge, compte, categorie, invitation, session, utilisateur, personne, foyer RESTART IDENTITY CASCADE`
    }

    let foyerId: number

    if (foyerIdCible === undefined) {
      const [foyer] = await tx<{ id: number }[]>`
        INSERT INTO foyer (nom, mode_repartition, dernier_reset)
        VALUES ('Foyer', 'prorata_revenus', ${DEBUT_CYCLE})
        RETURNING id
      `
      foyerId = foyer!.id

      await tx`
        INSERT INTO personne (foyer_id, prenom, salaire_net_cents, couleur, ordre)
        VALUES (${foyerId}, 'Hélène', 280000, 'violet', 0),
               (${foyerId}, 'Francis', 220000, 'turquoise', 1)
      `
    } else {
      // Rechargement depuis l'application : on remplace le contenu budgétaire du foyer
      // sans toucher aux personnes ni aux comptes utilisateurs. Les salaires sont
      // ramenés aux valeurs de référence, sans quoi les montants de répartition
      // affichés ne correspondraient plus à ceux de la documentation.
      foyerId = foyerIdCible
      await tx`DELETE FROM compte WHERE foyer_id = ${foyerId}`
      await tx`DELETE FROM categorie WHERE foyer_id = ${foyerId}`
      await tx`
        UPDATE foyer SET mode_repartition = 'prorata_revenus', dernier_reset = ${DEBUT_CYCLE}
        WHERE id = ${foyerId}
      `
      const personnes = await tx<{ id: number }[]>`
        SELECT id FROM personne WHERE foyer_id = ${foyerId} ORDER BY ordre, id
      `
      const salaires = [280000, 220000]
      for (const [i, personne] of personnes.entries()) {
        await tx`
          UPDATE personne SET salaire_net_cents = ${salaires[i] ?? 0} WHERE id = ${personne.id}
        `
      }
    }

    const categories = await tx<{ id: number; nom: string }[]>`
      INSERT INTO categorie ${tx(
        CATEGORIES.map((c, i) => ({ foyer_id: foyerId, nom: c.nom, icone: c.icone, couleur: c.couleur, ordre: i })),
      )}
      RETURNING id, nom
    `
    const idCategorie = new Map(categories.map((c) => [c.nom, c.id]))

    const comptes = await tx<{ id: number; role: string }[]>`
      INSERT INTO compte ${tx([
        { foyer_id: foyerId, nom: 'Compte prélèvements', banque: 'Crédit Mutuel', role: 'prelevements', couleur: 'bleu', ordre: 0 },
        { foyer_id: foyerId, nom: 'Compte carte', banque: 'Revolut', role: 'courant', couleur: 'violet', ordre: 1 },
        { foyer_id: foyerId, nom: 'Épargne provisions', banque: 'Revolut', role: 'provisions', couleur: 'turquoise', ordre: 2 },
      ])}
      RETURNING id, role
    `
    const idCompte = new Map(comptes.map((c) => [c.role, c.id]))

    const lignesCharges = [
      ...CHARGES_PRELEVEMENTS.map((c) => ({
        compte_id: idCompte.get('prelevements')!,
        categorie_id: idCategorie.get(c.cat)!,
        nom: c.nom,
        type: 'mensuelle',
        montant_cents: c.cents,
        jour_prelevement: c.jour,
        est_prelevee: c.prelevee,
        actif: true,
      })),
      ...CHARGES_COURANT.map((c) => ({
        compte_id: idCompte.get('courant')!,
        categorie_id: idCategorie.get(c.cat)!,
        nom: c.nom,
        type: 'mensuelle',
        montant_cents: c.cents,
        jour_prelevement: c.jour,
        est_prelevee: c.prelevee,
        actif: true,
      })),
      ...CHARGES_PROVISIONS.map((c) => ({
        compte_id: idCompte.get('provisions')!,
        categorie_id: idCategorie.get(c.cat)!,
        nom: c.nom,
        type: 'annuelle',
        montant_cents: c.cents,
        jour_prelevement: null,
        est_prelevee: false,
        actif: true,
      })),
    ]
    await tx`INSERT INTO charge ${tx(lignesCharges)}`

    for (const [i, b] of BUDGETS.entries()) {
      const [budget] = await tx<{ id: number }[]>`
        INSERT INTO budget (compte_id, categorie_id, nom, montant_mensuel_cents, ordre)
        VALUES (${idCompte.get('courant')!}, ${idCategorie.get(b.cat)!}, ${b.nom}, ${b.cents}, ${i})
        RETURNING id
      `
      if (b.depenses.length > 0) {
        await tx`
          INSERT INTO depense ${tx(
            b.depenses.map((d) => ({
              budget_id: budget!.id,
              personne_id: null,
              libelle: d.libelle,
              montant_cents: d.cents,
              date_depense: `2025-07-${String(d.jour).padStart(2, '0')}`,
            })),
          )}
        `
      }
    }

    return { foyerId }
  })
}

// Exécution directe : `npm run seed`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { foyerId } = await semer()
  console.log(`Jeu de démonstration chargé (foyer #${foyerId}).`)
  await sql.end()
}
