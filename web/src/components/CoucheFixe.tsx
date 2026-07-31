import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { LARGEUR_MOBILE } from '../theme.js'

/**
 * Calque flottant aligné sur la colonne mobile.
 *
 * Tout élément de l'interface qui « flotte » au-dessus du contenu — barre d'onglets,
 * bouton d'action — doit passer par ici plutôt que de se positionner lui-même.
 *
 * ── Pourquoi ce composant existe ──────────────────────────────────────────────
 * Centrer une boîte en `position: fixed` dans une colonne à largeur maximale est un
 * nid à pièges, et on s'y est fait prendre deux fois :
 *
 *   • `left: 0` + `right: 0` + `max-width` sans largeur définie : la boîte remplit
 *     d'abord tout l'espace, les marges `auto` tombent à zéro, puis `max-width` rogne —
 *     et la boîte se colle à gauche.
 *   • `left: 50%` + `translateX(-50%)` : imparable en théorie, mais toute animation qui
 *     pose un `transform` en style en ligne (les transitions MUI le font) écrase le
 *     centrage, et la boîte part à droite.
 *
 * La solution retenue n'utilise ni marges automatiques ni transformation : un calque
 * qui couvre l'écran, et un **centrage par flexbox**. `justify-content: center` n'a
 * aucun cas particulier, ne peut pas être sur-contraint, et rien ne l'écrase.
 *
 * Le calque laisse passer les clics (`pointerEvents: 'none'`) ; c'est à chaque enfant
 * de les réactiver, sinon une bande invisible bloquerait le contenu situé dessous.
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
