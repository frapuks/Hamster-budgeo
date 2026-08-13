import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErreurApi } from './api/client.js'
import { BarreOnglets } from './components/BarreOnglets.js'
import { useEtat } from './hooks/useEtat.js'
import { Accueil } from './pages/Accueil.js'
import { Charges } from './pages/Charges.js'
import { Couple } from './pages/Couple.js'
import { Connexion } from './pages/Connexion.js'
import { Demo } from './pages/Demo.js'
import { DetailBudget } from './pages/DetailBudget.js'
import { DetailCompte } from './pages/DetailCompte.js'
import { FormulaireBudget } from './pages/FormulaireBudget.js'
import { FormulaireCharge } from './pages/FormulaireCharge.js'
import { Reglages } from './pages/Reglages.js'
import { LARGEUR_MOBILE } from './theme.js'

/**
 * Colonne mobile centrée, commune à tous les écrans.
 *
 * Le retrait haut ajoute `env(safe-area-inset-top)` : installée en plein écran, la page
 * passe sous l'heure et les indicateurs réseau, et un titre collé au bord deviendrait
 * illisible. La valeur vaut 0 quand rien n'empiète, donc les 40 px restent le minimum.
 */
function Colonne({ children, avecOnglets }: { children: React.ReactNode; avecOnglets: boolean }) {
  return (
    <Box sx={{ minHeight: '100dvh', pb: avecOnglets ? 10 : 4 }}>
      <Box
        sx={{
          maxWidth: LARGEUR_MOBILE,
          mx: 'auto',
          px: 2,
          pt: 'calc(env(safe-area-inset-top, 0px) + 40px)',
        }}
      >
        {children}
      </Box>
      {avecOnglets && <BarreOnglets />}
    </Box>
  )
}

/**
 * L'état du foyer sert aussi de test de session : le serveur répond 401 sans cookie
 * valide. Pas besoin d'un appel d'authentification séparé.
 */
export function App() {
  const { isPending, isError, error } = useEtat()

  if (isPending) {
    return (
      <Colonne avecOnglets={false}>
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50dvh' }}>
          <CircularProgress />
        </Box>
      </Colonne>
    )
  }

  if (isError && error instanceof ErreurApi && error.statut === 401) {
    return (
      <Colonne avecOnglets={false}>
        <Connexion />
      </Colonne>
    )
  }

  return (
    <Colonne avecOnglets>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/comptes/:id" element={<DetailCompte />} />
        <Route path="/charges" element={<Charges />} />
        {/* Chemins littéraux avant la route paramétrée, sinon `:id` capte le mot. */}
        <Route path="/charges/nouvelle" element={<FormulaireCharge />} />
        <Route path="/charges/:id" element={<FormulaireCharge />} />
        {/* L'ancien onglet Budgets vit désormais dans l'accueil : on redirige plutôt
            que de laisser un écran vide aux marque-pages et à l'app installée. */}
        <Route path="/budgets" element={<Navigate to="/" replace />} />
        <Route path="/budgets/nouveau" element={<FormulaireBudget />} />
        <Route path="/budgets/:id/modifier" element={<FormulaireBudget />} />
        <Route path="/budgets/:id" element={<DetailBudget />} />
        <Route path="/couple" element={<Couple />} />
        <Route path="/reglages" element={<Reglages />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Colonne>
  )
}
