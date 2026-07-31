import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatEuros } from '@shared/format.js'
import { CarteCompte } from '../components/CarteCompte.js'
import { FeuilleNouveauCycle } from '../components/FeuilleNouveauCycle.js'
import { LigneBudget } from '../components/LigneBudget.js'
import { useEtat } from '../hooks/useEtat.js'
import { proportionRestante } from '../proportions.js'

function EnTeteSection({ titre, action }: { titre: string; action?: string }) {
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Typography variant="titreSection">{titre}</Typography>
      {action && <Typography variant="libelle">{action}</Typography>}
    </Stack>
  )
}

export function Accueil() {
  const navigate = useNavigate()
  const { data: etat, isPending, isError, error } = useEtat()
  const [cycleOuvert, setCycleOuvert] = useState(false)

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

  const budgets = comptes.flatMap((c) => c.budgets)

  return (
    <Stack spacing={4} sx={{ pb: 2 }}>
      {/* Le chiffre du quotidien ------------------------------------------- */}
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

      {/* Cartes de compte, en carrousel horizontal --------------------------- */}
      <Box>
        <EnTeteSection titre="Mes comptes" action={`${comptes.length} comptes`} />
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            // Les cartes débordent jusqu'aux bords plutôt que d'être coupées net.
            mx: -2,
            px: 2,
            // Indispensable avec le débordement ci-dessus : sans lui, l'accroche aligne
            // les cartes sur le bord de la zone de défilement en ignorant le padding,
            // et la première vient se coller au bord de l'écran.
            //
            // ⚠️ En pixels explicites : `sx` ne convertit l'unité d'espacement que pour
            // une liste connue de propriétés (margin, padding, gap…), dont
            // `scroll-padding` ne fait pas partie. Un `2` y vaudrait 2 px, pas 16.
            scrollPaddingInline: '16px',
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {comptes.map((compte) => (
            <CarteCompte
              key={compte.id}
              compte={compte}
              onClick={() => navigate(`/comptes/${compte.id}`)}
            />
          ))}
        </Box>
      </Box>

      {/* Budgets ------------------------------------------------------------ */}
      {budgets.length > 0 && (
        <Box>
          <EnTeteSection
            titre="Mes budgets"
            action={`${formatEuros(totaux.resteADepenserCents)} restants`}
          />
          <Stack spacing={1.25}>
            {budgets.map((budget) => (
              <LigneBudget key={budget.id} budget={budget} />
            ))}
          </Stack>
        </Box>
      )}

      {/* Virement permanent -------------------------------------------------- */}
      <Box>
        <EnTeteSection titre="Virement permanent" />
        <Typography variant="body2">
          Total à virer chaque mois sur l'ensemble des comptes :{' '}
          <Box component="span" sx={{ color: 'bleuClair', fontWeight: 700 }}>
            {formatEuros(totaux.virementPermanentCents)}
          </Box>
        </Typography>
      </Box>

      {/* Nouveau cycle — discret, parce qu'irréversible ----------------------- */}
      <Button
        variant="outlined"
        fullWidth
        startIcon={<AutorenewRoundedIcon />}
        onClick={() => setCycleOuvert(true)}
      >
        Nouveau cycle — tout décocher
      </Button>

      <FeuilleNouveauCycle
        ouverte={cycleOuvert}
        onFermer={() => setCycleOuvert(false)}
        etat={etat}
      />
    </Stack>
  )
}
