import { Box, CircularProgress } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { ErreurApi } from './api/client.js'
import { BarreOnglets } from './components/BarreOnglets.js'
import { useEtat } from './hooks/useEtat.js'
import { Accueil } from './pages/Accueil.js'
import { Budgets } from './pages/Budgets.js'
import { Charges } from './pages/Charges.js'
import { Connexion } from './pages/Connexion.js'
import { Demo } from './pages/Demo.js'
import { DetailBudget } from './pages/DetailBudget.js'
import { DetailCompte } from './pages/DetailCompte.js'
import { FormulaireBudget } from './pages/FormulaireBudget.js'
import { FormulaireCharge } from './pages/FormulaireCharge.js'
import { Reglages } from './pages/Reglages.js'
import { Repartition } from './pages/Repartition.js'
import { Virements } from './pages/Virements.js'
import { LARGEUR_MOBILE } from './theme.js'

/** Colonne mobile centrée, commune à tous les écrans. */
function Colonne({ children, avecOnglets }: { children: React.ReactNode; avecOnglets: boolean }) {
  return (
    <Box sx={{ minHeight: '100dvh', pb: avecOnglets ? 10 : 4 }}>
      <Box sx={{ maxWidth: LARGEUR_MOBILE, mx: 'auto', px: 2, pt: 4 }}>{children}</Box>
      {avecOnglets && <BarreOnglets />}
    </Box>
  )
}

/**
 * Racine de l'application.
 *
 * L'état du foyer sert aussi de test de session : le serveur répond 401 sans cookie
 * valide, et l'écran de connexion prend alors la place de l'application. Pas besoin
 * d'un appel d'authentification séparé — celui qui charge les données répond déjà à la
 * question « suis-je connecté ? ».
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
        {/* `nouvelle` avant `:id` : sans cet ordre, la route paramétrée capterait
            le mot et tenterait de charger une charge d'identifiant « nouvelle ». */}
        <Route path="/charges/nouvelle" element={<FormulaireCharge />} />
        <Route path="/charges/:id" element={<FormulaireCharge />} />
        <Route path="/budgets" element={<Budgets />} />
        {/* Comme pour les charges : les chemins littéraux avant la route paramétrée. */}
        <Route path="/budgets/nouveau" element={<FormulaireBudget />} />
        <Route path="/budgets/:id/modifier" element={<FormulaireBudget />} />
        <Route path="/budgets/:id" element={<DetailBudget />} />
        <Route path="/repartition" element={<Repartition />} />
        <Route path="/virements" element={<Virements />} />
        <Route path="/reglages" element={<Reglages />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </Colonne>
  )
}
