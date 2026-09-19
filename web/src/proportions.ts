import type { CompteCalcule } from '@hamsterbudgeo/shared/types.js'

/**
 * Convention : toutes les jauges montrent ce qui RESTE, jamais ce qui est consommé.
 * Elles partent pleines et se vident, comme les montants qu'elles accompagnent — une
 * jauge qui se remplirait à côté d'un chiffre qui diminue enverrait deux signaux
 * contraires. Bornée à [0, 100] : un dépassement vide la jauge sans l'inverser.
 */
export function proportionRestante(resteCents: number, totalCents: number): number {
  if (totalCents <= 0) return 0
  return Math.max(0, Math.min(100, (resteCents / totalCents) * 100))
}

/**
 * Jauge d'un compte : ce qu'il doit encore couvrir sur tout ce qu'il devait couvrir.
 *
 * Les budgets comptent des deux côtés, sinon la jauge d'un compte courant se viderait
 * au rythme des seules charges cochées, en ignorant des centaines d'euros d'enveloppes
 * encore à dépenser.
 */
export function proportionCompte(compte: CompteCalcule): number {
  const budgeteCents = compte.budgets.reduce((s, b) => s + b.montantMensuelCents, 0)
  return proportionRestante(compte.besoinDuCycleCents, compte.totalDuCycleCents + budgeteCents)
}
