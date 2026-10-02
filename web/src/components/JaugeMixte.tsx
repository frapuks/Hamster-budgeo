import { Box } from '@mui/material'
import { COULEURS, RAYONS } from '../theme.js'

/**
 * Jauge à deux segments, pour un compte qui porte les deux natures d'argent.
 *
 * Comme toutes les jauges de l'app, elle montre ce qui RESTE : les deux segments
 * partent pleins et se vident, l'un quand on coche une charge, l'autre quand on saisit
 * une dépense. Une barre unique confondrait les deux mouvements, alors qu'ils ne se
 * suivent pas de la même façon.
 *
 * Les dépassements sont écrasés à zéro : un budget explosé vide son segment sans
 * empiéter sur celui des charges.
 */
export function JaugeMixte({
  chargesCents,
  budgetsCents,
  totalCents,
}: {
  chargesCents: number
  budgetsCents: number
  totalCents: number
}) {
  const part = (cents: number) =>
    totalCents <= 0 ? 0 : Math.max(0, Math.min(100, (cents / totalCents) * 100))

  return (
    <Box
      sx={{
        display: 'flex',
        height: 8,
        borderRadius: `${RAYONS.pilule}px`,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Box sx={{ width: `${part(chargesCents)}%`, backgroundColor: COULEURS.bleuClair }} />
      <Box sx={{ width: `${part(budgetsCents)}%`, backgroundColor: COULEURS.vert }} />
    </Box>
  )
}
