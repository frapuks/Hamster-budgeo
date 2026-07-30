import { createTheme } from '@mui/material/styles'

/**
 * Thème minimal du lot 0 : juste de quoi ne pas travailler sur fond blanc.
 * Le vrai travail de thème (rayons, typographie tabulaire, surcharges de composants,
 * suppression du look Material) est le lot 0 bis.
 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0A0A0C', paper: '#16171C' },
    primary: { main: '#6E7BFF' },
    success: { main: '#34C759' },
    error: { main: '#FF6B5A' },
    text: { primary: '#FFFFFF', secondary: '#8E8E96' },
  },
  shape: { borderRadius: 20 },
})
