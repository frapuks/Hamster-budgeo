import { Box } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { BarreOnglets } from './components/BarreOnglets.js'
import { Accueil } from './pages/Accueil.js'
import { Budgets } from './pages/Budgets.js'
import { Charges } from './pages/Charges.js'
import { FormulaireCharge } from './pages/FormulaireCharge.js'
import { DetailBudget } from './pages/DetailBudget.js'
import { DetailCompte } from './pages/DetailCompte.js'
import { Demo } from './pages/Demo.js'
import { Reglages } from './pages/PagesVides.js'
import { Repartition } from './pages/Repartition.js'
import { Virements } from './pages/Virements.js'
import { LARGEUR_MOBILE } from './theme.js'

export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', pb: 10 }}>
      <Box sx={{ maxWidth: LARGEUR_MOBILE, mx: 'auto', px: 2, pt: 4 }}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/comptes/:id" element={<DetailCompte />} />
          <Route path="/charges" element={<Charges />} />
          {/* `nouvelle` avant `:id` : sans cet ordre, la route paramétrée capterait
              le mot et tenterait de charger une charge d'identifiant « nouvelle ». */}
          <Route path="/charges/nouvelle" element={<FormulaireCharge />} />
          <Route path="/charges/:id" element={<FormulaireCharge />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/budgets/:id" element={<DetailBudget />} />
          <Route path="/repartition" element={<Repartition />} />
          <Route path="/virements" element={<Virements />} />
          <Route path="/reglages" element={<Reglages />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </Box>
      <BarreOnglets />
    </Box>
  )
}
