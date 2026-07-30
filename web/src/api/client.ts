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

async function envoyer<T>(methode: 'POST' | 'DELETE', chemin: string, corps?: unknown): Promise<T> {
  const reponse = await fetch(chemin, {
    method: methode,
    ...(corps === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) }),
  })
  if (!reponse.ok) {
    throw new Error(`${chemin} a répondu ${reponse.status}`)
  }
  return reponse.json() as Promise<T>
}

/**
 * Une dépense n'est pas attribuée à une personne : dans un foyer où tout est commun,
 * savoir qui a sorti la carte n'apporte rien à la question posée par l'application —
 * « combien reste-t-il à dépenser ? ». La colonne existe encore en base, inutilisée.
 */
export interface NouvelleDepense {
  /** Facultatif : laissé vide, le serveur reprend le nom du budget. */
  libelle?: string
  montantCents: number
}

export const api = {
  getSante: () => get<Sante>('/api/health'),
  getEtat: () => get<EtatFoyer>('/api/etat'),

  /** Les mutations renvoient l'état complet : le cache est écrasé, jamais invalidé. */
  cocherCharge: (id: number, estPrelevee: boolean) =>
    patch<EtatFoyer>(`/api/charges/${id}/prelevee`, { estPrelevee }),

  ajouterDepense: (budgetId: number, depense: NouvelleDepense) =>
    envoyer<EtatFoyer>('POST', `/api/budgets/${budgetId}/depenses`, depense),

  supprimerDepense: (id: number) => envoyer<EtatFoyer>('DELETE', `/api/depenses/${id}`),
}
