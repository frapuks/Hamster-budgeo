import { Box, Container } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { BarreOnglets } from './components/BarreOnglets.js'
import { Accueil } from './pages/Accueil.js'
import { DetailCompte } from './pages/DetailCompte.js'
import { Demo } from './pages/Demo.js'
import { Budgets, Charges, Reglages } from './pages/PagesVides.js'

export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', pb: 10 }}>
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/comptes/:id" element={<DetailCompte />} />
          <Route path="/charges" element={<Charges />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/reglages" element={<Reglages />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </Container>
      <BarreOnglets />
    </Box>
  )
}
