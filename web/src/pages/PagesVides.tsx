import { Stack, Typography } from '@mui/material'

function PageVide({ titre, lot }: { titre: string; lot: string }) {
  return (
    <Stack spacing={1}>
      <Typography variant="h5" fontWeight={700}>
        {titre}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Écran prévu au {lot}.
      </Typography>
    </Stack>
  )
}

export const Charges = () => <PageVide titre="Mes charges" lot="lot 7" />
export const Budgets = () => <PageVide titre="Mes budgets" lot="lot 4" />
export const Reglages = () => <PageVide titre="Réglages" lot="lot 10" />
