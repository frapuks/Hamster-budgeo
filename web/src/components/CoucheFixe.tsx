import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { LARGEUR_MOBILE } from '../theme.js'

/**
 * Calque pour tout élément qui flotte au-dessus du contenu (barre d'onglets, bouton
 * d'action), centré sur la colonne mobile.
 *
 * Centrage par flexbox, ni marges automatiques ni transformation : les deux échouent
 * ici. Marges `auto` sans largeur définie → la boîte se colle à gauche ; `translateX`
 * → écrasé par le `transform` en ligne des animations MUI.
 *
 * Le calque laisse passer les clics ; à chaque enfant de les réactiver.
 */
export function CoucheFixe({
  children,
  zIndex = 5,
  sx = {},
}: {
  children: React.ReactNode
  zIndex?: number
  sx?: SxProps<Theme>
}) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex,
      }}
    >
      <Box
        sx={[
          {
            position: 'relative',
            width: '100%',
            maxWidth: `${LARGEUR_MOBILE}px`,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    </Box>
  )
}
