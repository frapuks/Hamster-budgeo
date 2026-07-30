import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { COULEURS, RAYONS } from '../theme.js'

type Statut = 'preleve' | 'a_venir' | 'depasse' | 'neutre'

const STYLES: Record<Statut, { texte: string; couleur: string }> = {
  preleve: { texte: 'Prélevé', couleur: COULEURS.vert },
  a_venir: { texte: 'À venir', couleur: COULEURS.bleuClair },
  depasse: { texte: 'Dépassé', couleur: COULEURS.corail },
  neutre: { texte: '—', couleur: '#8A93B2' },
}

/**
 * Petite étiquette d'état en fin de ligne : majuscules, très espacées, discrète.
 * Volontairement plus petite qu'un Chip MUI — elle ne doit pas concurrencer le montant.
 */
export function PuceStatut({ statut, libelle }: { statut: Statut; libelle?: string }) {
  const { texte, couleur } = STYLES[statut]
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.9,
        py: 0.35,
        borderRadius: `${RAYONS.puce}px`,
        backgroundColor: alpha(couleur, 0.14),
        color: couleur,
        fontSize: '0.625rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {libelle ?? texte}
    </Box>
  )
}
