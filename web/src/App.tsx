import { Box } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { BarreOnglets } from './components/BarreOnglets.js'
import { Accueil } from './pages/Accueil.js'
import { Budgets } from './pages/Budgets.js'
import { DetailBudget } from './pages/DetailBudget.js'
import { DetailCompte } from './pages/DetailCompte.js'
import { Demo } from './pages/Demo.js'
import { Charges, Reglages } from './pages/PagesVides.js'
import { LARGEUR_MOBILE } from './theme.js'

export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', pb: 10 }}>
      <Box sx={{ maxWidth: LARGEUR_MOBILE, mx: 'auto', px: 2, pt: 4 }}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/comptes/:id" element={<DetailCompte />} />
          <Route path="/charges" element={<Charges />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/budgets/:id" element={<DetailBudget />} />
          <Route path="/reglages" element={<Reglages />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </Box>
      <BarreOnglets />
    </Box>
  )
}
