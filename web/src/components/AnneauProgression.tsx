import { Box, Typography } from '@mui/material'
import { COULEURS } from '../theme.js'

/**
 * `pourcentage` est toujours ce qui RESTE : l'anneau part plein et se vide, comme le
 * montant qu'il entoure.
 *
 * En SVG plutôt qu'avec CircularProgress, pour maîtriser l'épaisseur du trait, les
 * extrémités arrondies et le départ à midi.
 */
export function AnneauProgression({
  pourcentage,
  valeur,
  legende,
  taille = 180,
  epaisseur = 10,
  couleur = COULEURS.bleuClair,
}: {
  pourcentage: number
  valeur: string
  legende?: string
  taille?: number
  epaisseur?: number
  couleur?: string
}) {
  const rayon = (taille - epaisseur) / 2
  const circonference = 2 * Math.PI * rayon
  const borne = Math.max(0, Math.min(100, pourcentage))
  const rempli = (borne / 100) * circonference

  return (
    <Box sx={{ position: 'relative', width: taille, height: taille }}>
      <svg width={taille} height={taille} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={epaisseur}
        />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${circonference - rempli}`}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontSize: taille * 0.18, fontWeight: 700, lineHeight: 1.1 }}>
          {valeur}
        </Typography>
        {legende && <Typography variant="libelle">{legende}</Typography>}
      </Box>
    </Box>
  )
}
