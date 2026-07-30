/**
 * Tous les appels HTTP passent par ce module.
 *
 * Le jour où l'on voudrait découper le cache en plusieurs clés, ou changer de transport,
 * c'est le seul fichier à toucher côté réseau.
 */
async function get<T>(chemin: string): Promise<T> {
  const reponse = await fetch(chemin)
  if (!reponse.ok) {
    throw new Error(`${chemin} a répondu ${reponse.status}`)
  }
  return reponse.json() as Promise<T>
}

import type { Sante } from '@shared/types.js'

export const api = {
  getSante: () => get<Sante>('/api/health'),
}
