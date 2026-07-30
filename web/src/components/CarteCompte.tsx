import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { formatEuros } from '@shared/format.js'
import type { CompteCalcule } from '@shared/types.js'
import { COULEURS_CATEGORIE, type CouleurCategorie } from './TuileCategorie.js'
import { Carte } from './Carte.js'

/**
 * Le chiffre mis en avant dépend du rôle du compte : ce n'est pas une préférence
 * d'affichage mais la structure même de l'application.
 *
 *   • prelevements → ce qui doit encore sortir
 *   • courant      → prélèvements restants + budgets restants
 *   • provisions   → le virement à faire, il n'y a rien à cocher
 */
function chiffreDuCompte(compte: CompteCalcule): { montantCents: number; legende: string } {
  const cochees = compte.charges.filter((c) => c.type === 'mensuelle' && c.estPrelevee).length
  const total = compte.charges.filter((c) => c.type === 'mensuelle').length

  switch (compte.role) {
    case 'prelevements':
      return {
        montantCents: compte.resteASortirCents,
        legende: `reste à sortir · ${cochees} charge${cochees > 1 ? 's' : ''} sur ${total} cochée${cochees > 1 ? 's' : ''}`,
      }
    case 'courant':
      return {
        montantCents: compte.besoinDuCycleCents,
        legende: `${formatEuros(compte.resteASortirCents)} de charges + ${formatEuros(compte.resteADepenserCents)} de budgets`,
      }
    case 'provisions':
      return {
        montantCents: compte.virementPermanentCents,
        legende: 'à virer ce cycle',
      }
  }
}

export function CarteCompte({ compte, onClick }: { compte: CompteCalcule; onClick?: () => void }) {
  const { montantCents, legende } = chiffreDuCompte(compte)
  const progression =
    compte.totalDuCycleCents > 0
      ? (compte.dejaPreleveCents / compte.totalDuCycleCents) * 100
      : 0

  const pastille =
    COULEURS_CATEGORIE[(compte.couleur as CouleurCategorie) in COULEURS_CATEGORIE
      ? (compte.couleur as CouleurCategorie)
      : 'ardoise']

  return (
    <Carte
      onClick={onClick}
      sx={{
        minWidth: 260,
        scrollSnapAlign: 'start',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '999px', backgroundColor: pastille }} />
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', flexGrow: 1 }} noWrap>
          {compte.nom}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }} noWrap>
          {compte.banque}
        </Typography>
      </Stack>

      <Typography variant="montantCarte" sx={{ mb: 0.5 }}>
        {formatEuros(montantCents)}
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1.5 }}>
        {legende}
      </Typography>

      {compte.role !== 'provisions' && (
        <LinearProgress
          variant="determinate"
          value={progression}
          color="secondary"
          sx={{ mb: 1.5, height: 6 }}
        />
      )}

      <Box sx={{ mt: 'auto' }}>
        <Chip
          size="small"
          icon={<AutorenewRoundedIcon sx={{ fontSize: 15 }} />}
          label={`Virement ${formatEuros(compte.virementPermanentCents)}/mois`}
        />
      </Box>
    </Carte>
  )
}
