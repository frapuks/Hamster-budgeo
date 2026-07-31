import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { EtatFoyer } from '@shared/types.js'
import { api, ErreurApi } from '../api/client.js'

/**
 * L'unique clé de cache de l'application.
 *
 * Choix délibéré : plutôt que de découper par entité (`['comptes']`, `['budgets']`…),
 * tout l'état du foyer tient sous une seule clé. Il pèse quelques kilo-octets et n'a
 * pas d'historique, donc rien ne justifie le découpage — alors qu'il apporterait la
 * principale source de bugs de TanStack Query : l'invalidation oubliée, qui laisse
 * deux écrans afficher des chiffres différents.
 */
export const CLE_ETAT = ['etat'] as const

export function useEtat() {
  return useQuery<EtatFoyer>({
    queryKey: CLE_ETAT,
    queryFn: api.getEtat,
    // Une session absente ou expirée n'est pas une panne : inutile de réessayer, c'est
    // l'écran de connexion qui doit prendre le relais.
    retry: (nombreEssais, erreur) =>
      erreur instanceof ErreurApi && erreur.statut === 401 ? false : nombreEssais < 2,
  })
}

/**
 * À utiliser dans le `onSuccess` de chaque mutation : les routes d'écriture renvoient
 * l'état complet, qu'on écrit directement dans le cache. Aucune invalidation, aucun
 * aller-retour supplémentaire.
 */
export function useRemplacerEtat() {
  const queryClient = useQueryClient()
  return (etat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, etat)
}
