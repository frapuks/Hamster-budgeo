import { Box, Checkbox, Stack, Typography } from '@mui/material'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { ChargeCalculee } from '@hamsterbudgeo/shared/types.js'
import { couleurDe, iconeDe } from '../icones.js'
import { Carte } from './Carte.js'
import { PuceStatut } from './PuceStatut.js'
import { TuileCategorie } from './TuileCategorie.js'

/**
 * Ligne de la checklist des prélèvements.
 *
 * Toute la carte est cliquable, pas seulement la case : sur un téléphone, viser une
 * case de 24 px au pouce est une source d'erreurs.
 */
export function LigneCharge({
  charge,
  onBascule,
}: {
  charge: ChargeCalculee
  onBascule: (estPrelevee: boolean) => void
}) {
  const coche = charge.estPrelevee

  return (
    <Carte
      onClick={() => onBascule(!coche)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        opacity: coche ? 0.55 : 1,
        transition: 'opacity 120ms ease',
        userSelect: 'none',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Checkbox
          checked={coche}
          disableRipple
          // La carte porte déjà le clic : la case ne doit pas le déclencher deux fois.
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onBascule(e.target.checked)}
        />
        <TuileCategorie
          Icone={iconeDe(charge.categorie?.icone)}
          couleur={couleurDe(charge.categorie?.couleur)}
          taille={40}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 600, textDecoration: coche ? 'line-through' : 'none' }}
            noWrap
          >
            {charge.nom}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }} noWrap>
            {charge.categorie?.nom ?? 'Sans catégorie'}
            {charge.jourPrelevement !== null && ` · le ${charge.jourPrelevement}`}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Typography
            sx={{ fontWeight: 700, textDecoration: coche ? 'line-through' : 'none' }}
          >
            {formatEuros(charge.montantCents)}
          </Typography>
          <PuceStatut statut={coche ? 'preleve' : 'a_venir'} />
        </Stack>
      </Stack>
    </Carte>
  )
}
