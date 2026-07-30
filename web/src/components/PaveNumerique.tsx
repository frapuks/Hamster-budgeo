import { Box, ButtonBase } from '@mui/material'
import BackspaceRoundedIcon from '@mui/icons-material/BackspaceRounded'
import { RAYONS } from '../theme.js'

/**
 * Pavé numérique de saisie d'un montant.
 *
 * Il ne manipule que des CENTIMES entiers : chaque touche décale la valeur d'un rang
 * (`cents * 10 + chiffre`), exactement comme un terminal de paiement. Aucune chaîne
 * n'est jamais convertie en nombre à virgule, donc aucun arrondi ne peut se glisser
 * entre ce qui est tapé et ce qui est enregistré.
 *
 * Effet de bord voulu : on tape « 7 8 0 0 » pour 78,00 €, jamais de virgule à placer.
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
