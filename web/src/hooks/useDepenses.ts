import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assemblerEtat } from '@shared/calculs.js'
import type { EtatFoyer } from '@shared/types.js'
import { api, type NouvelleDepense } from '../api/client.js'
import { CLE_ETAT } from './useEtat.js'

/**
 * Ajout d'une dépense.
 *
 * Pas de mise à jour optimiste ici : l'identifiant de la dépense est attribué par la
 * base, et fabriquer un identifiant provisoire côté client obligerait à le réconcilier
 * ensuite. La saisie se termine par la fermeture de la feuille, ce qui masque
 * naturellement l'aller-retour.
 */
export function useAjouterDepense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ budgetId, depense }: { budgetId: number; depense: NouvelleDepense }) =>
      api.ajouterDepense(budgetId, depense),
    onSuccess: (etat) => queryClient.setQueryData(CLE_ETAT, etat),
  })
}

/** Retire une dépense d'un état et recalcule tout, avec la fonction du serveur. */
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

/**
 * Suppression d'une dépense, en optimiste.
 *
 * Contrairement à l'ajout, il n'y a rien à réconcilier : la ligne existe déjà et on la
 * retire. Elle disparaît donc immédiatement, et revient si le serveur refuse.
 */
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
