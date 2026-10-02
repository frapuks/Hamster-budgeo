import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { CompteCalcule } from '@hamsterbudgeo/shared/types.js'
import { proportionCompte } from '../proportions.js'
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
function chiffreDuCompte(compte: CompteCalcule): {
  montantCents: number
  libelle: string
  detail: string
} {
  const mensuelles = compte.charges.filter((c) => c.type === 'mensuelle')
  const cochees = mensuelles.filter((c) => c.estPrelevee).length

  switch (compte.role) {
    case 'prelevements':
      return {
        montantCents: compte.resteASortirCents,
        libelle: 'reste à sortir',
        detail: `${cochees} sur ${mensuelles.length} cochées`,
      }
    case 'courant':
      return {
        montantCents: compte.besoinDuCycleCents,
        libelle: 'à couvrir',
        detail: `${formatEuros(compte.resteASortirCents)} de charges + ${formatEuros(compte.resteADepenserCents)} de budgets`,
      }
    case 'provisions':
      return {
        montantCents: compte.virementPermanentCents,
        libelle: 'à virer ce cycle',
        detail: `${formatEuros(compte.provisionMensuelleCents * 12)} de charges dans l'année`,
      }
  }
}

export function CarteCompte({ compte, onClick }: { compte: CompteCalcule; onClick?: () => void }) {
  const { montantCents, libelle, detail } = chiffreDuCompte(compte)
  const progression = proportionCompte(compte)

  const pastille =
    COULEURS_CATEGORIE[(compte.couleur as CouleurCategorie) in COULEURS_CATEGORIE
      ? (compte.couleur as CouleurCategorie)
      : 'ardoise']

  return (
    <Carte
      onClick={onClick}
      sx={{
        p: 1.75,
        cursor: onClick ? 'pointer' : 'default',
        // La couleur du compte tient tout le flanc gauche : elle remplace la pastille,
        // qui ferait double emploi, et se repère sans être lue.
        borderLeft: `4px solid ${pastille}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {compte.nom}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }} noWrap>
            {compte.banque} · {detail}
          </Typography>
        </Box>

        <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
          <Typography variant="montantCarte" sx={{ fontSize: '1.25rem' }}>
            {formatEuros(montantCents)}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
            {libelle}
          </Typography>
        </Stack>
      </Stack>

      {/* Le compte de provisions n'a rien à cocher : une jauge n'y aurait aucun sens. */}
      {compte.role !== 'provisions' && (
        <LinearProgress
          variant="determinate"
          value={progression}
          color="secondary"
          sx={{ mt: 1.5, height: 6 }}
        />
      )}

    </Carte>
  )
}
