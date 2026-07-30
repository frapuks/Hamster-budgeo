import type { SvgIconComponent } from '@mui/icons-material'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LabelRoundedIcon from '@mui/icons-material/LabelRounded'
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded'
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'
import type { CouleurCategorie } from './components/TuileCategorie.js'
import { COULEURS_CATEGORIE } from './components/TuileCategorie.js'

/**
 * Correspondance entre le nom d'icône stocké en base et le composant MUI.
 *
 * La base ne stocke qu'une chaîne : elle ne doit rien savoir de MUI, sans quoi
 * changer de bibliothèque d'icônes imposerait une migration de données.
 */
const ICONES: Record<string, SvgIconComponent> = {
  maison: HomeRoundedIcon,
  eclair: BoltRoundedIcon,
  goutte: WaterDropRoundedIcon,
  wifi: WifiRoundedIcon,
  bouclier: ShieldRoundedIcon,
  coeur: FavoriteRoundedIcon,
  lecture: PlayCircleRoundedIcon,
  voiture: DirectionsCarRoundedIcon,
  banque: AccountBalanceRoundedIcon,
  halteres: FitnessCenterRoundedIcon,
  panier: ShoppingCartRoundedIcon,
  restaurant: RestaurantRoundedIcon,
  etoile: AutoAwesomeRoundedIcon,
  poubelle: DeleteRoundedIcon,
  cle: BuildRoundedIcon,
}

/** Icône d'une catégorie, avec repli neutre si le nom stocké est inconnu. */
export function iconeDe(nom: string | undefined): SvgIconComponent {
  return (nom && ICONES[nom]) || LabelRoundedIcon
}

/** Couleur d'une catégorie, avec repli neutre si la couleur stockée est inconnue. */
export function couleurDe(nom: string | undefined): CouleurCategorie {
  return nom && nom in COULEURS_CATEGORIE ? (nom as CouleurCategorie) : 'ardoise'
}
