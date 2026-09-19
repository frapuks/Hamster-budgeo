import { Box, Typography } from '@mui/material'

/** Poignée et titre communs à toutes les feuilles ouvertes par le bas. */
export function PoigneeFeuille({ titre }: { titre: string }) {
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
      <Typography variant="libelle" sx={{ textAlign: 'center' }}>
        {titre}
      </Typography>
    </>
  )
}
