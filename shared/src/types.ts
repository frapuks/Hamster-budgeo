/**
 * Types de domaine. Sans ORM, ils font foi : c'est aux requêtes SQL de s'y conformer.
 * Tous les montants sont des entiers en centimes.
 */

export type RoleCompte = 'prelevements' | 'courant' | 'provisions'
export type TypeCharge = 'mensuelle' | 'annuelle'
export type ModeRepartition = 'moitie' | 'prorata_revenus' | 'reste_a_vivre_egal'


export interface Categorie {
  id: number
  nom: string
  icone: string
  couleur: string
}

export interface Personne {
  id: number
  prenom: string
  salaireNetCents: number
  couleur: string
}

/** ⚠️ `montantCents` : par mois si `mensuelle`, PAR AN si `annuelle`. Voir coutMensuelLisse(). */
export interface Charge {
  id: number
  compteId: number
  nom: string
  type: TypeCharge
  montantCents: number
  jourPrelevement: number | null
  estPrelevee: boolean
  actif: boolean
  categorie: Categorie | null
}

export interface Depense {
  id: number
  budgetId: number
  personneId: number | null
  libelle: string
  montantCents: number
  dateDepense: string
}

export interface Budget {
  id: number
  compteId: number
  nom: string
  montantMensuelCents: number
  categorie: Categorie | null
  depenses: Depense[]
}


export interface ChargeCalculee extends Charge {
  /** Contribution mensuelle au virement permanent. */
  coutMensuelLisseCents: number
}

export interface BudgetCalcule extends Budget {
  depenseCents: number
  /** Peut être négatif : c'est un dépassement, pas une anomalie. */
  resteADepenserCents: number
}

export interface CompteCalcule {
  id: number
  nom: string
  banque: string
  role: RoleCompte
  couleur: string
  ordre: number
  charges: ChargeCalculee[]
  budgets: BudgetCalcule[]

  /** Somme des charges mensuelles actives, cochées ou non. */
  totalDuCycleCents: number
  dejaPreleveCents: number
  /** Le chiffre roi des comptes `prelevements` et `courant`. */
  resteASortirCents: number
  /** Somme des restes à dépenser des budgets du compte. */
  resteADepenserCents: number
  /** Reste à sortir + reste à dépenser : ce que le compte doit encore couvrir. */
  besoinDuCycleCents: number
  /** Montant à mettre en virement permanent sur ce compte. */
  virementPermanentCents: number
  /** Part des charges annuelles dans le virement — significatif pour `provisions`. */
  provisionMensuelleCents: number
}

export interface PartRepartition {
  personneId: number
  prenom: string
  partCents: number
  resteAVivreCents: number
}

export interface Repartition {
  mode: ModeRepartition
  /** Total à répartir : la somme des virements permanents. */
  chargesCommunesCents: number
  parts: PartRepartition[]
}

export interface EtatFoyer {
  foyer: {
    id: number
    nom: string
    modeRepartition: ModeRepartition
    dernierReset: string
  }
  personnes: Personne[]
  categories: Categorie[]
  comptes: CompteCalcule[]
  totaux: {
    totalDuCycleCents: number
    dejaPreleveCents: number
    resteASortirCents: number
    virementPermanentCents: number
    budgeteCents: number
    depenseCents: number
    resteADepenserCents: number
  }
  repartition: Repartition
}

/** Réponse de GET /api/health. */
export interface Sante {
  ok: boolean
  base: 'connectee' | 'injoignable'
  version: string
}
