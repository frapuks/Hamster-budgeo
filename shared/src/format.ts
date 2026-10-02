/** Seul endroit autorisé à convertir des centimes en chaîne affichable. */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

/** « septembre 2026 » à partir d'un premier jour de mois en `YYYY-MM-DD`. */
export function formatMois(mois: string): string {
  const [annee, m] = mois.split('-')
  const d = new Date(Number(annee), Number(m) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}

/** « sept. » : l'étiquette courte d'une barre de graphique. */
export function formatMoisCourt(mois: string): string {
  const [annee, m] = mois.split('-')
  const d = new Date(Number(annee), Number(m) - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}
