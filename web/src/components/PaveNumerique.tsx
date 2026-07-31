import { Box, ButtonBase } from '@mui/material'
import BackspaceRoundedIcon from '@mui/icons-material/BackspaceRounded'
import { RAYONS } from '../theme.js'

/**
 * Ne manipule que des centimes entiers : chaque touche décale la valeur d'un rang,
 * comme un terminal de paiement. Aucune chaîne n'est convertie en nombre à virgule,
 * donc aucun arrondi entre ce qui est tapé et ce qui est enregistré. On tape
 * « 7 8 0 0 » pour 78,00 €.
 */
const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'effacer'] as const

export function PaveNumerique({
  valeurCents,
  onChange,
  maxCents = 99_999_99,
}: {
  valeurCents: number
  onChange: (cents: number) => void
  maxCents?: number
}) {
  const appuyer = (touche: (typeof TOUCHES)[number]) => {
    if (touche === 'effacer') {
      onChange(Math.floor(valeurCents / 10))
      return
    }
    const suffixe = touche === '00' ? 100 : 10
    const chiffre = touche === '00' ? 0 : Number(touche)
    const suivant = valeurCents * suffixe + chiffre
    if (suivant <= maxCents) onChange(suivant)
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
      {TOUCHES.map((touche) => (
        <ButtonBase
          key={touche}
          onClick={() => appuyer(touche)}
          sx={{
            height: 56,
            borderRadius: `${RAYONS.tuile}px`,
            backgroundColor: 'rgba(255,255,255,0.05)',
            fontSize: '1.375rem',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            '&:active': { backgroundColor: 'rgba(255,255,255,0.12)' },
          }}
        >
          {touche === 'effacer' ? <BackspaceRoundedIcon /> : touche}
        </ButtonBase>
      ))}
    </Box>
  )
}
