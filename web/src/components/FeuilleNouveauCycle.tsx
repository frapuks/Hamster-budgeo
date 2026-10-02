import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Drawer, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { moisDuCycle } from '@hamsterbudgeo/shared/calculs.js'
import { formatDate, formatEuros, formatMois } from '@hamsterbudgeo/shared/format.js'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { COULEURS, RAYONS } from '../theme.js'
import { Carte } from './Carte.js'
import { PoigneeFeuille } from './PoigneeFeuille.js'

/** Aujourd'hui en `YYYY-MM-DD`, heure locale : `toISOString` passerait en UTC. */
function jourCourant(): string {
  const d = new Date()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

function decaler(mois: string, decalage: number): string {
  const [annee, m] = mois.split('-').map(Number)
  const d = new Date(Date.UTC(annee!, m! - 1 + decalage, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Les mois proposés au choix : celui que la règle calcule, ses deux voisins, et ceux
 * autour d'aujourd'hui.
 *
 * En usage normal les deux séries se confondent et il n'en reste que trois. Elles
 * divergent quand un reset a été oublié pendant des mois : le milieu d'un cycle d'un an
 * ne veut alors plus rien dire, et il faut que le mois réellement voulu reste
 * atteignable.
 */
function moisProposes(calcule: string, aujourdhui: string): string[] {
  const duMois = `${aujourdhui.slice(0, 7)}-01`
  const candidats = [
    decaler(calcule, -1),
    calcule,
    decaler(calcule, 1),
    decaler(duMois, -1),
    duMois,
  ]
  return [...new Set(candidats)].sort()
}

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

  const calcule = moisDuCycle(etat.foyer.dernierReset, jourCourant())
  const choix = moisProposes(calcule, jourCourant())
  const [mois, setMois] = useState(calcule)

  useEffect(() => {
    if (ouverte) setMois(calcule)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouverte])

  const demarrer = useMutation({
    mutationFn: (moisChoisi: string) => api.demarrerNouveauCycle(moisChoisi),
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
        <PoigneeFeuille onFermer={onFermer} />

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

        {/* La règle du milieu de cycle tranche juste dans les cas courants, y compris
            un reset fait la veille ou le lendemain du changement de mois. Le choix
            reste ouvert pour les cycles inhabituels, que rien ne permet de deviner. */}
        <TextField
          select
          label="Dépenses comptabilisées pour"
          value={mois}
          onChange={(e) => setMois(e.target.value)}
          fullWidth
        >
          {choix.map((m) => (
            <MenuItem key={m} value={m}>
              {formatMois(m)}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={1} alignItems="flex-start">
          <WarningAmberRoundedIcon sx={{ color: COULEURS.corail, fontSize: 18, mt: '2px' }} />
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: COULEURS.corail }}>
            Les dépenses du cycle sont archivées, mais le détail du suivi en cours ne
            revient pas : cette action est définitive.
          </Typography>
        </Stack>

        <Button
          variant="contained"
          fullWidth
          disabled={demarrer.isPending}
          onClick={() => demarrer.mutate(mois)}
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
