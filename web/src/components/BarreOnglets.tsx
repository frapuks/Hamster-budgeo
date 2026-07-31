import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { COULEURS } from '../theme.js'
import { CoucheFixe } from './CoucheFixe.js'

const ONGLETS = [
  { chemin: '/', libelle: 'Accueil', Icone: HomeRoundedIcon },
  { chemin: '/charges', libelle: 'Charges', Icone: ReceiptLongRoundedIcon },
  { chemin: '/budgets', libelle: 'Budgets', Icone: PieChartRoundedIcon },
  { chemin: '/reglages', libelle: 'Réglages', Icone: SettingsRoundedIcon },
] as const

export function BarreOnglets() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Un sous-écran (`/charges/4`) doit garder son onglet parent allumé : on retient
  // l'onglet dont le chemin préfixe l'URL courante, le plus spécifique d'abord.
  const actif = ONGLETS.reduce(
    (meilleur, onglet, index) =>
      pathname === onglet.chemin ||
      (onglet.chemin !== '/' && pathname.startsWith(`${onglet.chemin}/`))
        ? index
        : meilleur,
    0,
  )

  return (
    <CoucheFixe zIndex={10}>
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'auto',
          borderRadius: 0,
          backgroundColor: COULEURS.fondBarre,
          border: 'none',
          borderTop: `1px solid ${COULEURS.lisere}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          showLabels
          value={actif}
          onChange={(_, index) => navigate(ONGLETS[index]!.chemin)}
          sx={{ backgroundColor: 'transparent' }}
        >
          {ONGLETS.map(({ chemin, libelle, Icone }) => (
            <BottomNavigationAction key={chemin} label={libelle} icon={<Icone />} />
          ))}
        </BottomNavigation>
      </Paper>
    </CoucheFixe>
  )
}
