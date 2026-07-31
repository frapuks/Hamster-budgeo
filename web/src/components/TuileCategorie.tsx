import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'
import { RAYONS } from '../theme.js'

/** Choisies claires pour rester lisibles sur fond marine. */
export const COULEURS_CATEGORIE = {
  bleu: '#6B8CFF',
  violet: '#B98CFF',
  turquoise: '#4ECDC4',
  corail: '#FF8A80',
  citron: '#C3E88D',
  ambre: '#FFC46B',
  ardoise: '#9AA4C4',
} as const

export type CouleurCategorie = keyof typeof COULEURS_CATEGORIE

/** Fond teinté translucide plutôt qu'aplat saturé : sur marine, l'aplat casse la hiérarchie. */
export function TuileCategorie({
  Icone,
  couleur,
  taille = 44,
}: {
  Icone: SvgIconComponent
  couleur: CouleurCategorie
  taille?: number
}) {
  const teinte = COULEURS_CATEGORIE[couleur]
  return (
    <Box
      sx={{
        width: taille,
        height: taille,
        flexShrink: 0,
        borderRadius: `${RAYONS.tuile}px`,
        backgroundColor: alpha(teinte, 0.16),
        border: `1px solid ${alpha(teinte, 0.22)}`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Icone sx={{ fontSize: taille * 0.5, color: teinte }} />
    </Box>
  )
}
