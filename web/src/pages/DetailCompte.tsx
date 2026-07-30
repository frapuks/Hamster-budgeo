import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { useNavigate, useParams } from 'react-router-dom'
import { formatEuros } from '@shared/format.js'
import type { CompteCalcule } from '@shared/types.js'
import { LigneBudget } from '../components/LigneBudget.js'
import { LigneCharge } from '../components/LigneCharge.js'
import { useCocherCharge } from '../hooks/useCocherCharge.js'
import { useEtat } from '../hooks/useEtat.js'

/** Le chiffre héros dépend du rôle, comme sur les cartes de l'accueil. */
function heros(compte: CompteCalcule): { libelle: string; montantCents: number } {
  switch (compte.role) {
    case 'prelevements':
      return { libelle: 'Reste à sortir', montantCents: compte.resteASortirCents }
    case 'courant':
      return { libelle: 'Il doit encore couvrir', montantCents: compte.besoinDuCycleCents }
    case 'provisions':
      return { libelle: 'Virement permanent', montantCents: compte.virementPermanentCents }
  }
}

export function DetailCompte() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: etat, isPending, isError } = useEtat()
  const cocher = useCocherCharge()

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={72} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const compte = etat.comptes.find((c) => c.id === Number(id))
  if (!compte) return <Alert severity="error">Ce compte n'existe pas.</Alert>

  const { libelle, montantCents } = heros(compte)
  const mensuelles = compte.charges.filter((c) => c.type === 'mensuelle')
  const annuelles = compte.charges.filter((c) => c.type === 'annuelle')
  const cochees = mensuelles.filter((c) => c.estPrelevee).length
  const progression =
    compte.totalDuCycleCents > 0 ? (compte.dejaPreleveCents / compte.totalDuCycleCents) * 100 : 0

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      {/* En-tête ------------------------------------------------------------ */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={() => navigate('/')} sx={{ ml: -1 }} aria-label="Retour">
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {compte.nom}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }} noWrap>
            {compte.banque}
          </Typography>
        </Box>
      </Stack>

      {/* Héros -------------------------------------------------------------- */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="libelle" sx={{ mb: 0.75 }}>
          {libelle}
        </Typography>
        <Typography variant="montantHero">{formatEuros(montantCents)}</Typography>

        {compte.role !== 'provisions' && (
          <>
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={2}
              sx={{ mt: 1.5 }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  Total
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatEuros(compte.totalDuCycleCents)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  Déjà prélevé
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatEuros(compte.dejaPreleveCents)}
                </Typography>
              </Box>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progression}
              color="secondary"
              sx={{ mt: 2 }}
            />
          </>
        )}

        <Chip
          size="small"
          icon={<AutorenewRoundedIcon sx={{ fontSize: 15 }} />}
          label={`Virement permanent ${formatEuros(compte.virementPermanentCents)}/mois`}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Checklist ---------------------------------------------------------- */}
      {mensuelles.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="titreSection">Prélèvements du cycle</Typography>
            <Typography variant="libelle">
              {cochees} sur {mensuelles.length}
            </Typography>
          </Stack>
          <Stack spacing={1.25}>
            {mensuelles.map((charge) => (
              <LigneCharge
                key={charge.id}
                charge={charge}
                onBascule={(estPrelevee) => cocher.mutate({ id: charge.id, estPrelevee })}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Charges annuelles — provisionnées, jamais cochées -------------------- */}
      {annuelles.length > 0 && (
        <Box>
          <Typography variant="titreSection" sx={{ mb: 1.5 }}>
            Ce que ça provisionne
          </Typography>
          <Stack spacing={1.25}>
            {annuelles.map((charge) => (
              <Box
                key={charge.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  px: 0.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{charge.nom}</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    {formatEuros(charge.montantCents)} par an
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatEuros(charge.coutMensuelLisseCents)}
                  <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                    /mois
                  </Box>
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Budgets du compte --------------------------------------------------- */}
      {compte.budgets.length > 0 && (
        <Box>
          <Typography variant="titreSection" sx={{ mb: 1.5 }}>
            Budgets du compte
          </Typography>
          <Stack spacing={1.25}>
            {compte.budgets.map((budget) => (
              <LigneBudget key={budget.id} budget={budget} />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}
