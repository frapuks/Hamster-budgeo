import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { COULEURS, RAYONS } from '../theme.js'

/**
 * Surface standard : marine clair, liseré discret.
 *
 * Le liseré est ce qui détache la carte du fond ; sans lui tout se noie. Il n'existe
 * qu'ici, jamais réécrit dans un écran.
 *
 * ⚠️ `borderRadius` n'est jamais un nombre dans `sx` : un nombre y multiplie
 * theme.shape.borderRadius. Toujours un jeton `RAYONS.x` en chaîne `px`.
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

/** Surface bleu plein : réservée à l'élément mis en avant d'une série. */
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
