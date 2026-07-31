import { Fab } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { CoucheFixe } from './CoucheFixe.js'

/**
 * Bouton d'action flottant, au bord droit de la colonne mobile.
 *
 * Positionné en absolu à l'intérieur du calque : celui-ci est déjà centré sur la
 * colonne, donc `right` se compte depuis le bord de la colonne, pas de l'écran.
 */
export function BoutonFlottant({ libelle, onClick }: { libelle: string; onClick: () => void }) {
  return (
    <CoucheFixe>
      <Fab
        color="primary"
        aria-label={libelle}
        onClick={onClick}
        sx={{
          position: 'absolute',
          bottom: '80px',
          right: '16px',
          pointerEvents: 'auto',
        }}
      >
        <AddRoundedIcon />
      </Fab>
    </CoucheFixe>
  )
}
