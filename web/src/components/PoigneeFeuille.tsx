import { Box, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

/**
 * Poignée, titre et fermeture communs à toutes les feuilles ouvertes par le bas.
 *
 * La croix double le geste de balayage et le clic sur le fond : sur ordinateur, ni
 * l'un ni l'autre n'est évident, et une feuille dont on ne voit pas comment sortir
 * ressemble à un blocage.
 *
 * Le titre est facultatif — certaines feuilles présentent un en-tête à elles, un
 * aperçu de catégorie par exemple, et n'ont besoin ici que de la poignée et de la croix.
 */
export function PoigneeFeuille({ titre, onFermer }: { titre?: string; onFermer: () => void }) {
  return (
    <>
      <Box
        sx={{
          width: 40,
          height: 4,
          borderRadius: '999px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          mx: 'auto',
        }}
      />
      <Stack direction="row" alignItems="center">
        {/* Contrepoids de la croix : sans lui, le titre centré serait décalé. */}
        <Box sx={{ width: 30, flexShrink: 0 }} />
        <Typography variant="libelle" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {titre}
        </Typography>
        <IconButton size="small" aria-label="Fermer" onClick={onFermer} sx={{ flexShrink: 0 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </>
  )
}
