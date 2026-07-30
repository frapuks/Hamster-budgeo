import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { COULEURS, LARGEUR_MOBILE } from '../theme.js'

const ONGLETS = [
  { chemin: '/', libelle: 'Accueil', Icone: HomeRoundedIcon },
  { chemin: '/charges', libelle: 'Charges', Icone: ReceiptLongRoundedIcon },
  { chemin: '/budgets', libelle: 'Budgets', Icone: PieChartRoundedIcon },
  { chemin: '/reglages', libelle: 'Réglages', Icone: SettingsRoundedIcon },
] as const

export function BarreOnglets() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const actif = ONGLETS.findIndex((o) => o.chemin === pathname)

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Même colonne mobile que le contenu, sinon la barre s'étire seule sur desktop.
        maxWidth: LARGEUR_MOBILE,
        mx: 'auto',
        borderRadius: 0,
        backgroundColor: COULEURS.fondBarre,
        border: 'none',
        borderTop: `1px solid ${COULEURS.lisere}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 10,
      }}
    >
      <BottomNavigation
        showLabels
        value={actif === -1 ? 0 : actif}
        onChange={(_, index) => navigate(ONGLETS[index]!.chemin)}
        sx={{ backgroundColor: 'transparent' }}
      >
        {ONGLETS.map(({ chemin, libelle, Icone }) => (
          <BottomNavigationAction key={chemin} label={libelle} icon={<Icone />} />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
