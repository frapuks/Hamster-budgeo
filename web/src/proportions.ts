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
