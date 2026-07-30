import type {
  Budget,
  BudgetCalcule,
  Charge,
  ChargeCalculee,
  ModeRepartition,
  PartRepartition,
  Personne,
} from './types.js'

/**
 * Le cœur métier de HamsterBudgeo.
 *
 * Fonctions pures, sans accès base, utilisées à l'identique par le serveur et le
 * front. Toutes travaillent en CENTIMES entiers ; aucune ne renvoie de décimale.
 */

// ── Le lissé : la parade au piège du montant ─────────────────────────────────

/**
 * Contribution mensuelle d'une charge.
 *
 * ⚠️ C'est LA fonction à utiliser partout. `charge.montantCents` ne doit jamais être
 * additionné directement : il vaut un montant mensuel pour une charge mensuelle, mais
 * un montant ANNUEL pour une charge annuelle. Additionner les deux donne un résultat
 * faux d'un facteur 12, sans que rien ne plante.
 */
export function coutMensuelLisse(charge: Pick<Charge, 'type' | 'montantCents'>): number {
  return charge.type === 'mensuelle' ? charge.montantCents : Math.round(charge.montantCents / 12)
}

// ── Charges d'un compte ──────────────────────────────────────────────────────

const estActiveMensuelle = (c: Charge) => c.actif && c.type === 'mensuelle'

/** Somme des charges mensuelles actives, cochées ou non. */
export function totalDuCycle(charges: Charge[]): number {
  return charges.filter(estActiveMensuelle).reduce((s, c) => s + c.montantCents, 0)
}

/** Somme des charges mensuelles actives déjà cochées. */
export function dejaPreleve(charges: Charge[]): number {
  return charges
    .filter((c) => estActiveMensuelle(c) && c.estPrelevee)
    .reduce((s, c) => s + c.montantCents, 0)
}

/** Le chiffre roi : ce qui doit encore sortir du compte d'ici la fin du cycle. */
export function resteASortir(charges: Charge[]): number {
  return charges
    .filter((c) => estActiveMensuelle(c) && !c.estPrelevee)
    .reduce((s, c) => s + c.montantCents, 0)
}

/** Part des charges annuelles dans le virement permanent d'un compte. */
export function provisionMensuelle(charges: Charge[]): number {
  return charges
    .filter((c) => c.actif && c.type === 'annuelle')
    .reduce((s, c) => s + coutMensuelLisse(c), 0)
}

// ── Budgets ──────────────────────────────────────────────────────────────────

export function totalDepense(budget: Budget): number {
  return budget.depenses.reduce((s, d) => s + d.montantCents, 0)
}

/** Peut être négatif : c'est un dépassement, une information utile, pas une erreur. */
export function resteADepenser(budget: Budget): number {
  return budget.montantMensuelCents - totalDepense(budget)
}

// ── Agrégats d'un compte ─────────────────────────────────────────────────────

/**
 * Montant du virement permanent : la somme des coûts mensuels lissés et des budgets.
 * C'est le nombre stable à recopier une fois dans l'application bancaire.
 */
export function virementPermanent(charges: Charge[], budgets: Budget[]): number {
  const chargesLissees = charges
    .filter((c) => c.actif)
    .reduce((s, c) => s + coutMensuelLisse(c), 0)
  const budgetes = budgets.reduce((s, b) => s + b.montantMensuelCents, 0)
  return chargesLissees + budgetes
}

/** Ce que le compte doit encore couvrir : prélèvements restants + budgets restants. */
export function besoinDuCycle(charges: Charge[], budgets: Budget[]): number {
  return resteASortir(charges) + budgets.reduce((s, b) => s + resteADepenser(b), 0)
}

// ── Enrichissement ───────────────────────────────────────────────────────────

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

// ── Répartition dans le couple ───────────────────────────────────────────────

/**
 * Répartit `totalCents` entre deux personnes selon le mode choisi.
 *
 * La base de calcul est toujours le LISSÉ (la somme des virements permanents), jamais
 * les montants réels du cycle : sinon la part de chacun varierait d'un mois à l'autre,
 * ce qui est incompatible avec un virement permanent.
 *
 * La part de la dernière personne est obtenue par soustraction, pour que la somme des
 * parts égale exactement le total même quand les arrondis tombent mal.
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
        // Chacun garde le même reste à vivre : p = (C + revenu − revenus des autres) / n
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
  // Le reliquat d'arrondi va sur la dernière part : la somme est exacte par construction.
  const sommeSaufDerniere = parts.slice(0, -1).reduce((s, v) => s + v, 0)
  parts[parts.length - 1] = totalCents - sommeSaufDerniere

  return personnes.map((p, i) => ({
    personneId: p.id,
    prenom: p.prenom,
    partCents: parts[i]!,
    resteAVivreCents: p.salaireNetCents - parts[i]!,
  }))
}
