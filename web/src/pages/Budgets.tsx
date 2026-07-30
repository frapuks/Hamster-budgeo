import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { formatEuros } from '@shared/format.js'
import { LigneBudget } from '../components/LigneBudget.js'
import { useEtat } from '../hooks/useEtat.js'

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

export function Budgets() {
  const navigate = useNavigate()
  const { data: etat, isPending, isError } = useEtat()

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={110} />
        <Skeleton variant="rounded" height={110} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const budgets = etat.comptes.flatMap((c) => c.budgets)

  if (budgets.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography variant="titreSection">Mes budgets</Typography>
        <Typography variant="body2">
          Aucun budget pour l'instant. Ils arriveront avec l'écran de création, au lot 7.
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Typography variant="titreSection">Mes budgets</Typography>

      <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
        <Stat libelle="Budgété" montantCents={etat.totaux.budgeteCents} />
        <Stat libelle="Dépensé" montantCents={etat.totaux.depenseCents} />
        <Stat libelle="Restant" montantCents={etat.totaux.resteADepenserCents} />
      </Stack>

      <Stack spacing={1.25}>
        {budgets.map((budget) => (
          <LigneBudget
            key={budget.id}
            budget={budget}
            onClick={() => navigate(`/budgets/${budget.id}`)}
          />
        ))}
      </Stack>

      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
        Les budgets non dépensés ne sont pas reportés au cycle suivant.
      </Typography>
    </Stack>
  )
}
