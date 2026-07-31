import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api, ErreurApi } from '../api/client.js'

/**
 * Clé de cache unique plutôt qu'un découpage par entité : l'état complet pèse quelques
 * kilo-octets, et le découpage n'apporterait que le risque d'invalidation oubliée, qui
 * laisse deux écrans afficher des chiffres différents.
 */
export const CLE_ETAT = ['etat'] as const

export function useEtat() {
  return useQuery<EtatFoyer>({
    queryKey: CLE_ETAT,
    queryFn: api.getEtat,
    // Une session absente n'est pas une panne : pas de réessai, l'écran de connexion prend le relais.
    retry: (nombreEssais, erreur) =>
      erreur instanceof ErreurApi && erreur.statut === 401 ? false : nombreEssais < 2,
  })
}

/** Les routes d'écriture renvoient l'état complet : on l'écrit dans le cache, sans invalidation. */
export function useRemplacerEtat() {
  const queryClient = useQueryClient()
  return (etat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, etat)
}
