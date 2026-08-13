import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api, ErreurApi } from '../api/client.js'
import { Carte } from '../components/Carte.js'
import { CarteCompte } from '../components/CarteCompte.js'
import { FeuilleCompte } from '../components/FeuilleCompte.js'
import { LigneBudget } from '../components/LigneBudget.js'
import { CLE_ETAT, useEtat } from '../hooks/useEtat.js'
import { proportionRestante } from '../proportions.js'
import { COULEURS, RAYONS } from '../theme.js'

function Stat({ libelle, montantCents }: { libelle: string; montantCents: number }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
        {libelle}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{formatEuros(montantCents)}</Typography>
    </Box>
  )
}

function EnTeteSection({ titre, action }: { titre: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
      <Typography variant="titreSection">{titre}</Typography>
      {typeof action === 'string' ? <Typography variant="libelle">{action}</Typography> : action}
    </Stack>
  )
}

export function Accueil() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: etat, isPending, isError, error } = useEtat()
  const [compteOuvert, setCompteOuvert] = useState(false)

  const chargerDemo = useMutation({
    mutationFn: api.chargerDemo,
    onSuccess: (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat),
  })

  if (isPending) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={170} />
        <Skeleton variant="rounded" height={90} />
        <Skeleton variant="rounded" height={90} />
      </Stack>
    )
  }

  if (isError) {
    return (
      <Alert severity="error">
        Impossible de charger tes données. {error instanceof Error ? error.message : ''}
      </Alert>
    )
  }

  const { totaux, comptes, foyer } = etat
  const progression = proportionRestante(totaux.resteASortirCents, totaux.totalDuCycleCents)

  const budgets = comptes.flatMap((c) => c.budgets).sort((a, b) => a.ordre - b.ordre)

  /**
   * Foyer vide : l'écran habituel n'afficherait qu'une coquille — un héros à zéro, un
   * carrousel vide — sans indiquer quoi faire. C'est le seul moment où le jeu d'exemple
   * a un intérêt, et il disparaît dès le premier compte créé.
   */
  if (comptes.length === 0) {
    return (
      <Stack spacing={2.5} sx={{ pt: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              borderRadius: `${RAYONS.carte}px`,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: 'rgba(51,85,255,0.16)',
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ color: COULEURS.bleuClair, fontSize: 30 }} />
          </Box>
          <Typography variant="h6">Ton foyer est vide</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Commence par créer un compte bancaire, ou charge un jeu d'exemple pour voir à
            quoi ressemble l'application.
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          startIcon={<AddRoundedIcon />}
          onClick={() => setCompteOuvert(true)}
        >
          Créer mon premier compte
        </Button>

        <Button
          variant="outlined"
          fullWidth
          disabled={chargerDemo.isPending}
          onClick={() => chargerDemo.mutate()}
        >
          {chargerDemo.isPending ? 'Chargement…' : 'Charger un exemple'}
        </Button>

        {chargerDemo.isError && (
          <Alert severity="error">
            {chargerDemo.error instanceof ErreurApi
              ? chargerDemo.error.message
              : 'Chargement impossible.'}
          </Alert>
        )}

        <FeuilleCompte ouverte={compteOuvert} onFermer={() => setCompteOuvert(false)} />
      </Stack>
    )
  }

  return (
    <Stack spacing={4} sx={{ pb: 2 }}>
      <Stack alignItems="center" spacing={1.5}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="libelle" sx={{ mb: 0.75 }}>
            Reste à sortir
          </Typography>
          <Typography variant="montantHero">{formatEuros(totaux.resteASortirCents)}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            sur {formatEuros(totaux.totalDuCycleCents)} prévus
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progression}
            color="secondary"
            sx={{ mt: 2 }}
          />
        </Box>
        <Chip
          size="small"
          icon={<AutorenewRoundedIcon sx={{ fontSize: 15 }} />}
          label={`Dernier reset le ${formatDate(foyer.dernierReset)}`}
        />
      </Stack>

      <Box>
        <EnTeteSection titre="Mes comptes" />
        <Stack spacing={1.25}>
          {comptes.map((compte) => (
            <CarteCompte
              key={compte.id}
              compte={compte}
              onClick={() => navigate(`/comptes/${compte.id}`)}
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <EnTeteSection titre="Mes budgets" />

        {budgets.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            Un budget est une enveloppe mensuelle — courses, essence, restaurants — dont tu
            déduis chaque dépense.
          </Typography>
        ) : (
          <>
            <Stack
              direction="row"
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ mb: 2 }}
            >
              <Stat libelle="Budgété" montantCents={totaux.budgeteCents} />
              <Stat libelle="Dépensé" montantCents={totaux.depenseCents} />
              <Stat libelle="Restant" montantCents={totaux.resteADepenserCents} />
            </Stack>

            <Stack spacing={1.25} sx={{ mb: 1.5 }}>
              {budgets.map((budget) => (
                <LigneBudget
                  key={budget.id}
                  budget={budget}
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>

      <Stack spacing={1.25}>
        <Carte onClick={() => navigate('/virements')} sx={{ cursor: 'pointer' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>Virements permanents</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                Les ordres à créer une fois dans ta banque
              </Typography>
            </Box>
            <Typography variant="montantCarte" sx={{ fontSize: '1.125rem' }}>
              {formatEuros(totaux.virementPermanentCents)}
            </Typography>
            <ChevronRightRoundedIcon sx={{ color: 'text.secondary' }} />
          </Stack>
        </Carte>

        <Carte onClick={() => navigate('/repartition')} sx={{ cursor: 'pointer' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>Répartition du couple</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                {etat.personnes.map((p) => p.prenom).join(' et ')}
              </Typography>
            </Box>
            <ChevronRightRoundedIcon sx={{ color: 'text.secondary' }} />
          </Stack>
        </Carte>
      </Stack>
    </Stack>
  )
}
