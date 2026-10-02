import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Stack } from '@mui/material'
import type { EtatFoyer, ModeRepartition, Personne } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { CartesModes } from './CartesModes.js'
import { PoigneeFeuille } from './PoigneeFeuille.js'

/**
 * Le choix du mode, avec les trois partages à comparer.
 *
 * Pas de bouton de validation : toucher une carte est le choix. Les trois montrent déjà
 * ce qu'elles donneraient, une étape de confirmation n'ajouterait rien à voir.
 */
export function FeuilleModeRepartition({
  ouverte,
  onFermer,
  personnes,
  modeActif,
  totalCents,
}: {
  ouverte: boolean
  onFermer: () => void
  personnes: Personne[]
  modeActif: ModeRepartition
  totalCents: number
}) {
  const queryClient = useQueryClient()

  const choisir = useMutation({
    mutationFn: (mode: ModeRepartition) => api.definirModeRepartition(mode),
    onSuccess: (etat: EtatFoyer) => {
      queryClient.setQueryData(CLE_ETAT, etat)
      onFermer()
    },
  })

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3, maxHeight: '88dvh', overflowY: 'auto' }}>
        <PoigneeFeuille titre="Mode de répartition" onFermer={onFermer} />

        <CartesModes
          personnes={personnes}
          modeActif={modeActif}
          totalCents={totalCents}
          onChoisir={(mode) => choisir.mutate(mode)}
        />
      </Stack>
    </Drawer>
  )
}
