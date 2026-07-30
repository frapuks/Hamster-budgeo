import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { formatEuros } from '@shared/format.js'
import type { BudgetCalcule } from '@shared/types.js'
import { couleurDe, iconeDe } from '../icones.js'
import { proportionRestante } from '../proportions.js'
import { TuileCategorie } from './TuileCategorie.js'
import { Carte } from './Carte.js'

export function LigneBudget({ budget, onClick }: { budget: BudgetCalcule; onClick?: () => void }) {
  const depasse = budget.resteADepenserCents < 0
  const proportion = proportionRestante(
    budget.resteADepenserCents,
    budget.montantMensuelCents,
  )

  return (
    <Carte onClick={onClick} sx={{ p: 1.75, cursor: onClick ? 'pointer' : 'default' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.25 }}>
        <TuileCategorie
          Icone={iconeDe(budget.categorie?.icone)}
          couleur={couleurDe(budget.categorie?.couleur)}
          taille={40}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {budget.nom}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {formatEuros(budget.depenseCents)} sur {formatEuros(budget.montantMensuelCents)}
          </Typography>
        </Box>
        <Stack alignItems="flex-end">
          <Typography
            variant="montantCarte"
            sx={{ fontSize: '1.25rem', color: depasse ? 'error.main' : 'bleuClair' }}
          >
            {formatEuros(budget.resteADepenserCents)}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
            {depasse ? 'dépassement' : 'restants'}
          </Typography>
          {budget.depenses.length > 0 && (
            <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
              {budget.depenses.length} dépense{budget.depenses.length > 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={proportion}
        color={depasse ? 'error' : 'secondary'}
      />
    </Carte>
  )
}
