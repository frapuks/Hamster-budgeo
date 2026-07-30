import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assemblerEtat } from '@shared/calculs.js'
import type { EtatFoyer } from '@shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from './useEtat.js'

/**
 * Applique un cochage à un état existant et recalcule tous les agrégats.
 *
 * Le point clé : on rappelle `assemblerEtat`, exactement la fonction qu'utilise le
 * serveur. La mise à jour optimiste ne peut donc pas produire des chiffres différents
 * de ceux qui arriveront dans la réponse — sinon l'interface « sauterait » au retour
 * du serveur, et le doute s'installerait sur le bon total.
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
 * Coche ou décoche une charge, avec bascule immédiate de l'interface.
 *
 * Sur un téléphone, l'aller-retour réseau se voit : sans mise à jour optimiste, la
 * case resterait vide un instant après le clic et donnerait l'impression d'un raté.
 * En cas d'échec, l'état précédent est restauré.
 */
export function useCocherCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estPrelevee }: { id: number; estPrelevee: boolean }) =>
      api.cocherCharge(id, estPrelevee),

    onMutate: async ({ id, estPrelevee }) => {
      // Sans cette annulation, une lecture en vol pourrait écraser la bascule optimiste.
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
