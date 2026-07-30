import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded'
import WalletRoundedIcon from '@mui/icons-material/WalletRounded'
import { RAYONS } from '../theme.js'

/**
 * Les trois natures d'argent de l'application. Un élément est forcément l'une des
 * trois, et jamais deux à la fois.
 */
export type TypeElement = 'mensuelle' | 'annuelle' | 'budget'

/**
 * Libellés et couleurs. Tout est centralisé ici : changer un mot-clé ou une teinte
 * se fait sur une seule ligne et se répercute partout.
 */
export const TYPES = {
  mensuelle: {
    libelle: 'Mensuel',
    couleur: '#6B8CFF',
    Icone: CalendarMonthRoundedIcon,
    /** Unité du montant saisi — c'est ce qui protège du piège du ×12. */
    unite: 'par mois',
  },
  annuelle: {
    libelle: 'Annuel',
    couleur: '#FFC46B',
    Icone: EventRepeatRoundedIcon,
    unite: 'par an',
  },
  budget: {
    libelle: 'Budget',
    couleur: '#4ECDC4',
    Icone: WalletRoundedIcon,
    unite: 'par mois',
  },
} as const satisfies Record<TypeElement, { libelle: string; couleur: string; Icone: unknown; unite: string }>

/**
 * Étiquette de nature, posée sur chaque carte de charge ou de budget.
 *
 * Distincte de PuceStatut (« Prélevé / À venir ») : celle-ci dit *ce que l'élément
 * est*, l'autre dit *où il en est*. Elles peuvent cohabiter sur une même ligne, d'où
 * deux traitements visuels différents — icône et casse normale ici, majuscules là.
 */
export function PuceType({ type, compact = false }: { type: TypeElement; compact?: boolean }) {
  const { libelle, couleur, Icone } = TYPES[type]
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: compact ? 0.75 : 1,
        py: 0.4,
        borderRadius: `${RAYONS.puce}px`,
        backgroundColor: alpha(couleur, 0.14),
        border: `1px solid ${alpha(couleur, 0.22)}`,
        color: couleur,
        fontSize: '0.6875rem',
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <Icone sx={{ fontSize: 13 }} />
      {libelle}
    </Box>
  )
}
