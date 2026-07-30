import { Box, Fab } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { LARGEUR_MOBILE } from '../theme.js'

/**
 * Bouton d'action flottant, aligné sur le bord droit de la colonne mobile.
 *
 * Centrage par `left: 50%` + `translateX(-50%)` plutôt que par marges automatiques :
 * une boîte positionnée avec `left` ET `right` définis, contrainte par un `max-width`,
 * est sur-contrainte, et le navigateur résout le conflit en ignorant `right` — la boîte
 * se colle alors à gauche. Ici il n'y a qu'un seul bord fixé, donc aucun conflit.
 *
 * Toutes les distances sont en pixels explicites : dans `sx`, un nombre nu est
 * multiplié par l'unité d'espacement du thème pour certaines propriétés, ce qui rend
 * `bottom: 80` ambigu selon les versions.
 *
 * `pointerEvents: 'none'` sur le conteneur : il couvre toute la colonne et ne doit pas
 * intercepter les clics destinés au contenu situé dessous.
 */
export function BoutonFlottant({ libelle, onClick }: { libelle: string; onClick: () => void }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: `${LARGEUR_MOBILE}px`,
        paddingInline: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <Fab color="primary" aria-label={libelle} onClick={onClick} sx={{ pointerEvents: 'auto' }}>
        <AddRoundedIcon />
      </Fab>
    </Box>
  )
}
