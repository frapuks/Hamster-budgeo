import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type SaisieCharge } from '../api/client.js'
import { CLE_ETAT } from './useEtat.js'

/**
 * Écriture d'une charge : création, modification, suppression.
 *
 * Aucune de ces trois opérations n'est optimiste. Elles partent toutes d'un écran qu'on
 * quitte aussitôt — formulaire validé, boîte de confirmation fermée — ce qui masque
 * l'aller-retour. La bascule optimiste n'a d'intérêt que sur un geste répété où l'on
 * reste sur place, comme cocher une charge.
 */
export function useEcrireCharge() {
  const queryClient = useQueryClient()
  const surSucces = (etat: Parameters<typeof queryClient.setQueryData>[1]) =>
    queryClient.setQueryData(CLE_ETAT, etat)

  const creer = useMutation({
    mutationFn: (saisie: SaisieCharge) => api.creerCharge(saisie),
    onSuccess: surSucces,
  })

  const modifier = useMutation({
    mutationFn: ({ id, saisie }: { id: number; saisie: SaisieCharge }) =>
      api.modifierCharge(id, saisie),
    onSuccess: surSucces,
  })

  const supprimer = useMutation({
    mutationFn: (id: number) => api.supprimerCharge(id),
    onSuccess: surSucces,
  })

  return { creer, modifier, supprimer }
}
