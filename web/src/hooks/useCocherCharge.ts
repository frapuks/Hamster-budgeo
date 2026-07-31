import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assemblerEtat } from '@hamsterbudgeo/shared/calculs.js'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from './useEtat.js'

/**
 * Recalcule avec `assemblerEtat`, la fonction même du serveur : la mise à jour optimiste
 * ne peut donc pas produire des chiffres différents de la réponse à venir.
 */
function etatApresCochage(etat: EtatFoyer, chargeId: number, estPrelevee: boolean): EtatFoyer {
  return assemblerEtat({
    foyer: etat.foyer,
    personnes: etat.personnes,
    categories: etat.categories,
    comptes: etat.comptes.map((compte) => ({
      ...compte,
      charges: compte.charges.map((c) => (c.id === chargeId ? { ...c, estPrelevee } : c)),
    })),
  })
}

/**
 * Bascule immédiate : sans elle, la case resterait vide le temps de l'aller-retour
 * réseau et donnerait l'impression d'un raté. L'état précédent revient en cas d'échec.
 */
export function useCocherCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estPrelevee }: { id: number; estPrelevee: boolean }) =>
      api.cocherCharge(id, estPrelevee),

    onMutate: async ({ id, estPrelevee }) => {
      // Sans annulation, une lecture en vol écraserait la bascule optimiste.
      await queryClient.cancelQueries({ queryKey: CLE_ETAT })
      const precedent = queryClient.getQueryData<EtatFoyer>(CLE_ETAT)
      if (precedent) {
        queryClient.setQueryData(CLE_ETAT, etatApresCochage(precedent, id, estPrelevee))
      }
      return { precedent }
    },

    onError: (_erreur, _variables, contexte) => {
      if (contexte?.precedent) {
        queryClient.setQueryData(CLE_ETAT, contexte.precedent)
      }
    },

    onSuccess: (etatServeur) => {
      queryClient.setQueryData(CLE_ETAT, etatServeur)
    },
  })
}
