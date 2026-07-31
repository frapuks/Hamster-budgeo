import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { COULEURS, RAYONS } from '../theme.js'

/**
 * Surface standard. Le liseré, défini ici seulement, est ce qui détache la carte du
 * fond marine.
 */
export function Carte({
  children,
  sx = {},
  onClick,
}: {
  children: React.ReactNode
  sx?: SxProps<Theme>
  onClick?: () => void
}) {
  return (
    <Box
      onClick={onClick}
      sx={[
        {
          backgroundColor: 'background.paper',
          border: `1px solid ${COULEURS.lisere}`,
          borderRadius: `${RAYONS.carte}px`,
          p: 2.25,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}

/** Réservée à l'élément mis en avant d'une série. */
export function CarteBleue({
  children,
  sx = {},
  onClick,
}: {
  children: React.ReactNode
  sx?: SxProps<Theme>
  onClick?: () => void
}) {
  return (
    <Box
      onClick={onClick}
      sx={[
        {
          backgroundColor: COULEURS.bleu,
          borderRadius: `${RAYONS.carte}px`,
          p: 2.25,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}
