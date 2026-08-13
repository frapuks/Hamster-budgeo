import { Box, Stack, Typography } from '@mui/material'

/** Titre de section, avec une action facultative alignée à droite. */
export function Section({
  titre,
  action,
  children,
}: {
  titre: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.25 }}
      >
        <Typography variant="libelle">{titre}</Typography>
        {action}
      </Stack>
      {children}
    </Box>
  )
}
