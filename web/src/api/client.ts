import type { EtatFoyer, Sante } from '@shared/types.js'

/**
 * Tous les appels HTTP passent par ce module.
 *
 * Les URL sont relatives : en développement le proxy Vite les renvoie vers le serveur,
 * en production c'est le serveur lui-même qui sert les fichiers statiques. Aucune
 * question de CORS dans un cas comme dans l'autre.
 */
async function get<T>(chemin: string): Promise<T> {
  const reponse = await fetch(chemin)
  if (!reponse.ok) {
    throw new Error(`${chemin} a répondu ${reponse.status}`)
  }
  return reponse.json() as Promise<T>
}

async function patch<T>(chemin: string, corps: unknown): Promise<T> {
  const reponse = await fetch(chemin, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  })
  if (!reponse.ok) {
    throw new Error(`${chemin} a répondu ${reponse.status}`)
  }
  return reponse.json() as Promise<T>
}

export const api = {
  getSante: () => get<Sante>('/api/health'),
  getEtat: () => get<EtatFoyer>('/api/etat'),

  /** Les mutations renvoient l'état complet : le cache est écrasé, jamais invalidé. */
  cocherCharge: (id: number, estPrelevee: boolean) =>
    patch<EtatFoyer>(`/api/charges/${id}/prelevee`, { estPrelevee }),
}
