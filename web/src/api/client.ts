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

export const api = {
  getSante: () => get<Sante>('/api/health'),
  getEtat: () => get<EtatFoyer>('/api/etat'),
}
