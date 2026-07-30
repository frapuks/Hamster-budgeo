import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { formatEuros } from '@shared/format.js'

export function Accueil() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['sante'],
    queryFn: api.getSante,
  })

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Accueil
      </Typography>

      <Box>
        <Typography variant="overline" color="text.secondary">
          Câblage du lot 0
        </Typography>

        {isPending && <CircularProgress size={20} sx={{ display: 'block', mt: 1 }} />}

        {isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            Le serveur ne répond pas. Vérifie que <code>npm run dev</code> tourne.
          </Alert>
        )}

        {data && (
          <Stack spacing={1} sx={{ mt: 1 }} alignItems="flex-start">
            <Chip
              label={data.base === 'connectee' ? 'Base de données connectée' : 'Base injoignable'}
              color={data.base === 'connectee' ? 'success' : 'error'}
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              API en version {data.version}
            </Typography>
          </Stack>
        )}
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">
          Formatage partagé
        </Typography>
        <Typography variant="h4" fontWeight={800}>
          {formatEuros(125155)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rendu par <code>shared/format.ts</code>, depuis 125155 centimes.
        </Typography>
      </Box>

      <Button component={Link} to="/demo" variant="outlined">
        Voir la démonstration du thème
      </Button>
    </Stack>
  )
}
