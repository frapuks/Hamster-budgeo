import { fileURLToPath } from 'node:url'
import { sql } from './db/client.js'

/**
 * Jeu de démonstration.
 *
 * Totaux attendus, qui servent aussi de repères de vérification :
 *   Compte prélèvements : 1 289,42 € · coché 176,89 € · reste 1 112,53 €
 *   Compte carte        :    94,98 € · coché  13,98 € · reste    81,00 €
 *   Budgets             :   950,00 € · dépensé 586,70 € · restant 363,30 €
 *   Provisions          : 1 272,00 €/an · 106,00 €/mois
 *   Virements permanents: 1 289,42 + 1 044,98 + 106,00 = 2 440,40 €/mois
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
  { nom: 'Abonnement TV', cents: 1199, jour: 2, prelevee: true, cat: 'Abonnements' },
  { nom: 'Électricité', cents: 8850, jour: 5, prelevee: true, cat: 'Énergie' },
  { nom: 'Mutuelle', cents: 7640, jour: 8, prelevee: true, cat: 'Santé' },
  { nom: 'Loyer', cents: 78000, jour: 10, prelevee: false, cat: 'Logement' },
  { nom: 'Assurance habitation', cents: 2875, jour: 12, prelevee: false, cat: 'Assurance' },
  { nom: 'Internet', cents: 3499, jour: 15, prelevee: false, cat: 'Télécom' },
  { nom: 'Téléphone', cents: 1599, jour: 18, prelevee: false, cat: 'Télécom' },
  { nom: 'Assurance auto', cents: 5420, jour: 20, prelevee: false, cat: 'Assurance' },
  { nom: 'Impôt sur le revenu', cents: 19860, jour: 25, prelevee: false, cat: 'Impôts' },
] satisfies { nom: string; cents: number; jour: number; prelevee: boolean; cat: NomCategorie }[]

const CHARGES_COURANT = [
  { nom: 'Salle de sport', cents: 2490, jour: 3, prelevee: false, cat: 'Sport' },
  { nom: 'Musique en ligne', cents: 1099, jour: 4, prelevee: true, cat: 'Abonnements' },
  { nom: 'Stockage en ligne', cents: 299, jour: 6, prelevee: true, cat: 'Abonnements' },
  { nom: 'Assurance téléphone', cents: 750, jour: 14, prelevee: false, cat: 'Assurance' },
  { nom: 'Abonnement transport', cents: 4860, jour: 20, prelevee: false, cat: 'Transport' },
] satisfies { nom: string; cents: number; jour: number; prelevee: boolean; cat: NomCategorie }[]

/** Montants ANNUELS, divisibles par 12 pour que la provision tombe sur des centimes ronds. */
const CHARGES_PROVISIONS = [
  { nom: 'Eau', cents: 54000, cat: 'Eau' },
  { nom: 'Ordures ménagères', cents: 24000, cat: 'Déchets' },
  { nom: 'Entretien voiture', cents: 38400, cat: 'Véhicule' },
  { nom: 'Ramonage chaudière', cents: 10800, cat: 'Logement' },
] satisfies { nom: string; cents: number; cat: NomCategorie }[]

const BUDGETS = [
  {
    nom: 'Courses',
    cents: 35000,
    cat: 'Alimentation',
    depenses: [
      { libelle: 'Supermarché', cents: 9830, jour: 2 },
      { libelle: 'Marché', cents: 2460, jour: 4 },
      { libelle: 'Supérette', cents: 7615, jour: 6 },
      { libelle: 'Boulangerie', cents: 1245, jour: 7 },
      { libelle: 'Supermarché', cents: 5690, jour: 8 },
    ],
  },
  {
    nom: 'Essence',
    cents: 32000,
    cat: 'Transport',
    depenses: [{ libelle: 'Station-service', cents: 6250, jour: 5 }],
  },
  {
    nom: 'Restaurants',
    cents: 18000,
    cat: 'Restaurants',
    depenses: [
      { libelle: 'Bistrot', cents: 5240, jour: 3 },
      { libelle: 'Pizzeria', cents: 3890, jour: 6 },
      { libelle: 'Brunch', cents: 5190, jour: 8 },
    ],
  },
  {
    nom: 'Loisirs',
    cents: 10000,
    cat: 'Loisirs',
    depenses: [
      { libelle: 'Cinéma', cents: 1980, jour: 4 },
      { libelle: 'Concert', cents: 7400, jour: 7 },
      { libelle: 'Librairie', cents: 1880, jour: 8 },
    ],
  },
] satisfies {
  nom: string
  cents: number
  cat: NomCategorie
  depenses: { libelle: string; cents: number; jour: number }[]
}[]

const DEBUT_CYCLE = '2025-07-01'
const SALAIRES = [240000, 190000]

/**
 * `semer()` sans argument remet toute la base à zéro, comptes utilisateurs compris :
 * réservé à `npm run seed`. `semer(foyerId)` remplace le seul contenu budgétaire du
 * foyer visé — sans cette distinction, charger la démo depuis l'application
 * déconnecterait ses deux membres.
 */
export async function semer(foyerIdCible?: number): Promise<{ foyerId: number }> {
  return sql.begin(async (tx) => {
    if (foyerIdCible === undefined) {
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
        VALUES (${foyerId}, 'Alex', ${SALAIRES[0]!}, 'violet', 0),
               (${foyerId}, 'Camille', ${SALAIRES[1]!}, 'turquoise', 1)
      `
    } else {
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
      for (const [i, personne] of personnes.entries()) {
        await tx`
          UPDATE personne SET salaire_net_cents = ${SALAIRES[i] ?? 0} WHERE id = ${personne.id}
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
        { foyer_id: foyerId, nom: 'Compte prélèvements', banque: 'Banque principale', role: 'prelevements', couleur: 'bleu', ordre: 0 },
        { foyer_id: foyerId, nom: 'Compte carte', banque: 'Néobanque', role: 'courant', couleur: 'violet', ordre: 1 },
        { foyer_id: foyerId, nom: 'Épargne provisions', banque: 'Livret', role: 'provisions', couleur: 'turquoise', ordre: 2 },
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { foyerId } = await semer()
  console.log(`Jeu de démonstration chargé (foyer #${foyerId}).`)
  await sql.end()
}
