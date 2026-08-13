import { IconButton } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { COULEURS } from '../theme.js'

/**
 * Crayon d'édition d'une section.
 *
 * Sur une section qui bascule sur place, il devient une coche : un crayon figé ne
 * dirait pas comment refermer ce qu'on vient d'ouvrir. Un bouton qui ouvre un tiroir
 * n'a pas cet état et se contente du crayon. Les libellés restent explicites pour la
 * navigation au lecteur d'écran, privée du contraste entre les deux dessins.
 */
export function BoutonEdition({
  actif = false,
  labelModifier,
  labelTerminer = labelModifier,
  onClick,
}: {
  actif?: boolean
  labelModifier: string
  labelTerminer?: string
  onClick: () => void
}) {
  const Icone = actif ? CheckRoundedIcon : EditRoundedIcon

  return (
    <IconButton
      size="small"
      aria-label={actif ? labelTerminer : labelModifier}
      onClick={onClick}
      sx={{ p: 0.25, color: COULEURS.bleuClair }}
    >
      <Icone sx={{ fontSize: 18 }} />
    </IconButton>
  )
}
