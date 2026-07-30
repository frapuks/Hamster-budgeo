/**
 * Formatage des montants.
 *
 * Règle non négociable du projet : tous les montants circulent en CENTIMES, dans des
 * entiers. Cette fonction est le seul endroit autorisé à produire une chaîne en euros.
 */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/** Date au format « 01/07/2025 », utilisé pour l'affichage du dernier reset. */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}
