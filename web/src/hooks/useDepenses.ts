import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assemblerEtat } from '@hamsterbudgeo/shared/calculs.js'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api, type NouvelleDepense } from '../api/client.js'
import { CLE_ETAT } from './useEtat.js'

/**
 * Pas de mise à jour optimiste : l'identifiant vient de la base, et la fermeture de la
 * feuille masque déjà l'aller-retour.
 */
export function useAjouterDepense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ budgetId, depense }: { budgetId: number; depense: NouvelleDepense }) =>
      api.ajouterDepense(budgetId, depense),
    onSuccess: (etat) => queryClient.setQueryData(CLE_ETAT, etat),
  })
}

function etatSansDepense(etat: EtatFoyer, depenseId: number): EtatFoyer {
  return assemblerEtat({
    foyer: etat.foyer,
    personnes: etat.personnes,
    categories: etat.categories,
    comptes: etat.comptes.map((compte) => ({
      ...compte,
      budgets: compte.budgets.map((b) => ({
        ...b,
        depenses: b.depenses.filter((d) => d.id !== depenseId),
      })),
    })),
  })
}

/** Optimiste, contrairement à l'ajout : la ligne existe déjà, il n'y a rien à réconcilier. */
export function useSupprimerDepense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.supprimerDepense(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CLE_ETAT })
      const precedent = queryClient.getQueryData<EtatFoyer>(CLE_ETAT)
      if (precedent) {
        queryClient.setQueryData(CLE_ETAT, etatSansDepense(precedent, id))
      }
      return { precedent }
    },

    onError: (_e, _v, contexte) => {
      if (contexte?.precedent) queryClient.setQueryData(CLE_ETAT, contexte.precedent)
    },

    onSuccess: (etat) => queryClient.setQueryData(CLE_ETAT, etat),
  })
}
