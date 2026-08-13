import { IconButton } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { COULEURS } from '../theme.js'

/**
 * Action d'ajout d'une ligne de titre.
 *
 * Le libellé disparaît au profit du seul « + » : l'intitulé de la section dit déjà ce
 * qu'on ajoute. `aria-label` reste obligatoire, sans quoi le bouton n'est plus qu'un
 * signe pour qui navigue au lecteur d'écran.
 */
export function BoutonAjouter({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <IconButton size="small" aria-label={label} onClick={onClick} sx={{ p: 0.25, color: COULEURS.bleuClair }}>
      <AddRoundedIcon sx={{ fontSize: 20 }} />
    </IconButton>
  )
}
