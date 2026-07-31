import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import { api, ErreurApi } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { COULEURS, RAYONS } from '../theme.js'

type Onglet = 'connexion' | 'inscription' | 'rejoindre'

/**
 * Écran d'entrée : connexion, création d'un foyer, ou rattachement à un foyer existant.
 *
 * Les trois cas partagent le même écran plutôt que trois pages : ils demandent presque
 * les mêmes champs, et un utilisateur qui se trompe d'onglet n'a pas à naviguer.
 */
export function Connexion() {
  const queryClient = useQueryClient()
  const [onglet, setOnglet] = useState<Onglet>('connexion')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [prenom, setPrenom] = useState('')
  const [prenomConjoint, setPrenomConjoint] = useState('')
  const [code, setCode] = useState('')

  const entrer = useMutation({
    mutationFn: () => {
      if (onglet === 'connexion') return api.connexion(email.trim(), motDePasse)
      if (onglet === 'rejoindre') return api.rejoindre(code.trim(), email.trim(), motDePasse)
      return api.inscription({
        email: email.trim(),
        motDePasse,
        prenom: prenom.trim(),
        prenomConjoint: prenomConjoint.trim(),
      })
    },
    // La réponse contient déjà l'état complet : on le pose dans le cache, l'application
    // s'affiche sans aller-retour supplémentaire.
    onSuccess: (etat) => queryClient.setQueryData(CLE_ETAT, etat),
  })

  const valide =
    email.trim().length > 3 &&
    motDePasse.length >= (onglet === 'connexion' ? 1 : 8) &&
    (onglet !== 'inscription' || (prenom.trim() !== '' && prenomConjoint.trim() !== '')) &&
    (onglet !== 'rejoindre' || code.trim().length >= 4)

  return (
    <Stack spacing={3} sx={{ pt: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            borderRadius: `${RAYONS.carte}px`,
            display: 'grid',
            placeItems: 'center',
            backgroundColor: 'rgba(51,85,255,0.16)',
          }}
        >
          <SavingsRoundedIcon sx={{ color: COULEURS.bleuClair, fontSize: 32 }} />
        </Box>
        <Typography variant="h5">HamsterBudgeo</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Le budget du foyer, sans surprise en fin de mois
        </Typography>
      </Box>

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={onglet}
        onChange={(_, v) => {
          if (v) {
            setOnglet(v as Onglet)
            entrer.reset()
          }
        }}
      >
        <ToggleButton value="connexion">Connexion</ToggleButton>
        <ToggleButton value="inscription">Créer</ToggleButton>
        <ToggleButton value="rejoindre">Rejoindre</ToggleButton>
      </ToggleButtonGroup>

      {onglet === 'rejoindre' && (
        <TextField
          label="Code d'invitation"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 12, style: { letterSpacing: '0.2em' } } }}
          helperText="Le code à six caractères transmis par ton conjoint"
        />
      )}

      {onglet === 'inscription' && (
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Ton prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            fullWidth
          />
          <TextField
            label="Son prénom"
            value={prenomConjoint}
            onChange={(e) => setPrenomConjoint(e.target.value)}
            fullWidth
          />
        </Stack>
      )}

      <TextField
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      />
      <TextField
        label="Mot de passe"
        type="password"
        autoComplete={onglet === 'connexion' ? 'current-password' : 'new-password'}
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && valide && entrer.mutate()}
        fullWidth
        helperText={onglet === 'connexion' ? undefined : 'Huit caractères minimum'}
      />

      {entrer.isError && (
        <Alert severity="error">
          {entrer.error instanceof ErreurApi ? entrer.error.message : 'Une erreur est survenue.'}
        </Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        disabled={!valide || entrer.isPending}
        onClick={() => entrer.mutate()}
      >
        {entrer.isPending
          ? 'Un instant…'
          : onglet === 'connexion'
            ? 'Se connecter'
            : onglet === 'rejoindre'
              ? 'Rejoindre le foyer'
              : 'Créer mon foyer'}
      </Button>
    </Stack>
  )
}
