import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Drawer, Stack, Typography } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { formatDate, formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { COULEURS, RAYONS } from '../theme.js'
import { Carte } from './Carte.js'

function LigneEffacee({ texte }: { texte: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{ width: 6, height: 6, borderRadius: '999px', backgroundColor: COULEURS.corail, flexShrink: 0 }}
      />
      <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.primary' }}>
        {texte}
      </Typography>
    </Stack>
  )
}

/**
 * Confirmation du nouveau cycle.
 *
 * Elle énumère ce qui va disparaître, chiffres à l'appui, plutôt que de poser une
 * question générique. C'est la seule action irréversible de l'application : sans
 * historique, rien de ce qui est effacé ici ne peut être retrouvé, et une confirmation
 * vague inviterait à cliquer sans lire.
 */
export function FeuilleNouveauCycle({
  ouverte,
  onFermer,
  etat,
}: {
  ouverte: boolean
  onFermer: () => void
  etat: EtatFoyer
}) {
  const queryClient = useQueryClient()

  const demarrer = useMutation({
    mutationFn: api.demarrerNouveauCycle,
    onSuccess: (nouvelEtat) => {
      queryClient.setQueryData(CLE_ETAT, nouvelEtat)
      onFermer()
    },
  })

  const charges = etat.comptes.flatMap((c) => c.charges)
  const cochees = charges.filter((c) => c.estPrelevee).length
  const depenses = etat.comptes.flatMap((c) => c.budgets).flatMap((b) => b.depenses)

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            mx: 'auto',
          }}
        />

        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: 'auto',
              mb: 1.5,
              borderRadius: `${RAYONS.tuile}px`,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: 'rgba(51,85,255,0.16)',
            }}
          >
            <AutorenewRoundedIcon sx={{ color: COULEURS.bleuClair, fontSize: 28 }} />
          </Box>
          <Typography variant="h6">Démarrer un nouveau cycle</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Tes charges, tes comptes et tes budgets ne changent pas. Seul le suivi du cycle
            en cours est remis à zéro.
          </Typography>
        </Box>

        <Carte>
          <Stack spacing={1}>
            <LigneEffacee
              texte={
                cochees === 0
                  ? 'Aucune charge cochée à décocher'
                  : `${cochees} charge${cochees > 1 ? 's' : ''} cochée${cochees > 1 ? 's' : ''} ${cochees > 1 ? 'seront décochées' : 'sera décochée'}`
              }
            />
            <LigneEffacee
              texte={
                depenses.length === 0
                  ? 'Aucune dépense à effacer'
                  : `${depenses.length} dépense${depenses.length > 1 ? 's' : ''} ${depenses.length > 1 ? 'seront effacées' : 'sera effacée'} (${formatEuros(etat.totaux.depenseCents)})`
              }
            />
            <LigneEffacee texte={`Le cycle repartira du ${formatDate(new Date())}`} />
          </Stack>
        </Carte>

        <Stack direction="row" spacing={1} alignItems="flex-start">
          <WarningAmberRoundedIcon sx={{ color: COULEURS.corail, fontSize: 18, mt: '2px' }} />
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: COULEURS.corail }}>
            Cette action est définitive : l'application ne garde aucun historique.
          </Typography>
        </Stack>

        <Button
          variant="contained"
          fullWidth
          disabled={demarrer.isPending}
          onClick={() => demarrer.mutate()}
        >
          {demarrer.isPending ? 'En cours…' : 'Démarrer le nouveau cycle'}
        </Button>
        <Button variant="text" fullWidth onClick={onFermer}>
          Annuler
        </Button>
      </Stack>
    </Drawer>
  )
}
