import type {
  Budget,
  Contribution,
  BudgetCalcule,
  Categorie,
  Charge,
  ChargeCalculee,
  CompteCalcule,
  EtatFoyer,
  ModeRepartition,
  PartRepartition,
  Personne,
  RoleCompte,
} from './types.js'

/**
 * Cœur métier : fonctions pures, sans accès base, utilisées à l'identique par le
 * serveur et le front. Tout est en centimes entiers.
 */

/**
 * ⚠️ Seule façon autorisée de convertir une charge en contribution mensuelle.
 * `charge.montantCents` vaut un montant mensuel pour une charge mensuelle, mais un
 * montant ANNUEL pour une charge annuelle : l'additionner directement donne un
 * résultat faux d'un facteur 12, sans que rien ne plante.
 */
export function coutMensuelLisse(charge: Pick<Charge, 'type' | 'montantCents'>): number {
  return charge.type === 'mensuelle' ? charge.montantCents : Math.round(charge.montantCents / 12)
}

/**
 * Coût d'une charge sur douze mois, quelle que soit sa périodicité.
 *
 * Calculé depuis le montant réel plutôt qu'en multipliant le lissé par douze : sur une
 * charge annuelle non divisible, l'arrondi du lissé fausserait le total.
 */
export function coutAnnuel(charge: Pick<Charge, 'type' | 'montantCents'>): number {
  return charge.type === 'annuelle' ? charge.montantCents : charge.montantCents * 12
}

const estActiveMensuelle = (c: Charge) => c.actif && c.type === 'mensuelle'

export function totalDuCycle(charges: Charge[]): number {
  return charges.filter(estActiveMensuelle).reduce((s, c) => s + c.montantCents, 0)
}

export function dejaPreleve(charges: Charge[]): number {
  return charges
    .filter((c) => estActiveMensuelle(c) && c.estPrelevee)
    .reduce((s, c) => s + c.montantCents, 0)
}

export function resteASortir(charges: Charge[]): number {
  return charges
    .filter((c) => estActiveMensuelle(c) && !c.estPrelevee)
    .reduce((s, c) => s + c.montantCents, 0)
}

export function provisionMensuelle(charges: Charge[]): number {
  return charges
    .filter((c) => c.actif && c.type === 'annuelle')
    .reduce((s, c) => s + coutMensuelLisse(c), 0)
}

/**
 * Seul endroit où des `montantCents` sont additionnés sans lissage — légitime, puisque
 * seules des charges annuelles sont sommées, toutes dans la même unité.
 */
export function totalAnnuel(charges: Charge[]): number {
  return charges
    .filter((c) => c.actif && c.type === 'annuelle')
    .reduce((s, c) => s + c.montantCents, 0)
}

export function totalDepense(budget: Budget): number {
  return budget.depenses.reduce((s, d) => s + d.montantCents, 0)
}

/** Peut être négatif : c'est un dépassement, pas une anomalie. */
export function resteADepenser(budget: Budget): number {
  return budget.montantMensuelCents - totalDepense(budget)
}

/** Le montant stable à recopier une fois dans l'application bancaire. */
export function virementPermanent(charges: Charge[], budgets: Budget[]): number {
  const chargesLissees = charges
    .filter((c) => c.actif)
    .reduce((s, c) => s + coutMensuelLisse(c), 0)
  return chargesLissees + budgets.reduce((s, b) => s + b.montantMensuelCents, 0)
}

export function besoinDuCycle(charges: Charge[], budgets: Budget[]): number {
  return resteASortir(charges) + budgets.reduce((s, b) => s + resteADepenser(b), 0)
}

/** Ce qui arrive réellement sur un compte, toutes personnes confondues. */
export function verseSurCompte(contributions: Contribution[], compteId: number): number {
  return contributions
    .filter((c) => c.compteId === compteId)
    .reduce((s, c) => s + c.montantCents, 0)
}

/**
 * Écart entre ce qui arrive sur le compte et ce qu'il réclame chaque mois.
 *
 * Négatif : le compte est sous-alimenté, un prélèvement finira par manquer. Positif :
 * de l'argent s'y accumule sans emploi. Zéro est la cible.
 */
export function deltaCompte(
  compte: Pick<CompteCalcule, 'id' | 'virementPermanentCents'>,
  contributions: Contribution[],
): number {
  return verseSurCompte(contributions, compte.id) - compte.virementPermanentCents
}

/**
 * Répartit le besoin de chaque compte selon le mode choisi.
 *
 * Le mode est appliqué une seule fois, sur le total, puis chaque compte est découpé
 * dans le même rapport. L'appliquer compte par compte serait faux pour
 * `reste_a_vivre_egal` : sa correction par les salaires se cumulerait autant de fois
 * qu'il y a de comptes.
 *
 * La dernière personne reçoit le reste de chaque division, si bien que chaque compte
 * est financé exactement. En contrepartie, le total versé par une personne peut
 * s'écarter de sa part théorique de quelques centimes.
 */
export function repartirSurComptes(
  mode: ModeRepartition,
  personnes: Personne[],
  comptes: Pick<CompteCalcule, 'id' | 'virementPermanentCents'>[],
): Contribution[] {
  if (personnes.length === 0) return []

  const total = comptes.reduce((s, c) => s + c.virementPermanentCents, 0)
  const parts = repartir(mode, personnes, total)

  return comptes.flatMap((compte) => {
    let attribue = 0
    return personnes.map((personne, i) => {
      const montantCents =
        i === personnes.length - 1
          ? compte.virementPermanentCents - attribue
          : total <= 0
            ? 0
            : Math.round((compte.virementPermanentCents * parts[i]!.partCents) / total)
      attribue += montantCents
      return { personneId: personne.id, compteId: compte.id, montantCents }
    })
  })
}

export interface BilanPersonne {
  personneId: number
  prenom: string
  /** Somme de ses virements, tous comptes confondus. */
  verseCents: number
  /** Part de son salaire qu'elle y consacre, en pourcentage. */
  partDuSalaire: number
  /** Part de la charge commune qu'elle porte, en pourcentage. */
  partDesCharges: number
  resteAVivreCents: number
}

/**
 * Bilan par personne, calculé sur les montants réellement paramétrés — pas sur la
 * répartition théorique. C'est le seul endroit où l'on sait si le partage annoncé
 * correspond à ce qui part vraiment des comptes.
 */
export function bilanCouple(
  personnes: Personne[],
  contributions: Contribution[],
  totalChargesCents: number,
): BilanPersonne[] {
  const pourcent = (part: number, total: number) => (total <= 0 ? 0 : (part * 100) / total)

  return personnes.map((personne) => {
    const verseCents = contributions
      .filter((c) => c.personneId === personne.id)
      .reduce((s, c) => s + c.montantCents, 0)

    return {
      personneId: personne.id,
      prenom: personne.prenom,
      verseCents,
      partDuSalaire: pourcent(verseCents, personne.salaireNetCents),
      partDesCharges: pourcent(verseCents, totalChargesCents),
      resteAVivreCents: personne.salaireNetCents - verseCents,
    }
  })
}

export function calculerCharge(charge: Charge): ChargeCalculee {
  return { ...charge, coutMensuelLisseCents: coutMensuelLisse(charge) }
}

export function calculerBudget(budget: Budget): BudgetCalcule {
  return {
    ...budget,
    depenseCents: totalDepense(budget),
    resteADepenserCents: resteADepenser(budget),
  }
}

export interface CompteBrut {
  id: number
  nom: string
  banque: string
  role: RoleCompte
  couleur: string
  ordre: number
  charges: Charge[]
  budgets: Budget[]
}

/**
 * Assemble l'état complet du foyer.
 *
 * Appelée par le serveur après ses requêtes SQL et par le front pour ses mises à jour
 * optimistes : deux chemins d'agrégation distincts finiraient par diverger, et l'écart
 * serait invisible — un écran afficherait un total juste, l'autre un total faux.
 */
export function assemblerEtat(brut: {
  foyer: EtatFoyer['foyer']
  personnes: Personne[]
  categories: Categorie[]
  comptes: CompteBrut[]
  contributions: Contribution[]
}): EtatFoyer {
  const comptes: CompteCalcule[] = brut.comptes.map((compte) => ({
    id: compte.id,
    nom: compte.nom,
    banque: compte.banque,
    role: compte.role,
    couleur: compte.couleur,
    ordre: compte.ordre,
    charges: compte.charges.map(calculerCharge),
    budgets: compte.budgets.map(calculerBudget),
    totalDuCycleCents: totalDuCycle(compte.charges),
    dejaPreleveCents: dejaPreleve(compte.charges),
    resteASortirCents: resteASortir(compte.charges),
    resteADepenserCents: compte.budgets.reduce((s, b) => s + resteADepenser(b), 0),
    besoinDuCycleCents: besoinDuCycle(compte.charges, compte.budgets),
    virementPermanentCents: virementPermanent(compte.charges, compte.budgets),
    provisionMensuelleCents: provisionMensuelle(compte.charges),
  }))

  const somme = (f: (c: CompteCalcule) => number) => comptes.reduce((s, c) => s + f(c), 0)
  const virementTotal = somme((c) => c.virementPermanentCents)
  const tousBudgets = brut.comptes.flatMap((c) => c.budgets)

  return {
    foyer: brut.foyer,
    personnes: brut.personnes,
    categories: brut.categories,
    comptes,
    contributions: brut.contributions,
    totaux: {
      totalDuCycleCents: somme((c) => c.totalDuCycleCents),
      dejaPreleveCents: somme((c) => c.dejaPreleveCents),
      resteASortirCents: somme((c) => c.resteASortirCents),
      virementPermanentCents: virementTotal,
      budgeteCents: tousBudgets.reduce((s, b) => s + b.montantMensuelCents, 0),
      depenseCents: tousBudgets.reduce((s, b) => s + totalDepense(b), 0),
      resteADepenserCents: somme((c) => c.resteADepenserCents),
    },
    repartition: {
      mode: brut.foyer.modeRepartition,
      chargesCommunesCents: virementTotal,
      parts: repartir(brut.foyer.modeRepartition, brut.personnes, virementTotal),
    },
  }
}

/**
 * Répartit `totalCents` entre les personnes du foyer.
 *
 * La base est toujours le lissé, jamais le réel du cycle : sinon la part de chacun
 * varierait d'un mois à l'autre, ce qui est incompatible avec un virement permanent.
 * La dernière part est obtenue par soustraction pour que la somme égale exactement le
 * total, même quand les arrondis tombent mal.
 */
export function repartir(
  mode: ModeRepartition,
  personnes: Personne[],
  totalCents: number,
): PartRepartition[] {
  if (personnes.length === 0) return []

  const revenus = personnes.reduce((s, p) => s + p.salaireNetCents, 0)

  const partBrute = (p: Personne): number => {
    switch (mode) {
      case 'moitie':
        return Math.round(totalCents / personnes.length)
      case 'prorata_revenus':
        return revenus === 0
          ? Math.round(totalCents / personnes.length)
          : Math.round((totalCents * p.salaireNetCents) / revenus)
      case 'reste_a_vivre_egal': {
        const autres = revenus - p.salaireNetCents
        const n = personnes.length
        return Math.round((totalCents + (n - 1) * p.salaireNetCents - autres) / n)
      }
      default: {
        const _exhaustif: never = mode
        return _exhaustif
      }
    }
  }

  const parts = personnes.map(partBrute)
  const sommeSaufDerniere = parts.slice(0, -1).reduce((s, v) => s + v, 0)
  parts[parts.length - 1] = totalCents - sommeSaufDerniere

  return personnes.map((p, i) => ({
    personneId: p.id,
    prenom: p.prenom,
    partCents: parts[i]!,
    resteAVivreCents: p.salaireNetCents - parts[i]!,
  }))
}
