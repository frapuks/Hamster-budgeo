import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { CompteCalcule, EtatFoyer, RoleCompte } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { COULEURS_CATEGORIE, type CouleurCategorie } from './TuileCategorie.js'
import { RAYONS } from '../theme.js'

/**
 * Les trois rôles, avec ce qu'ils changent concrètement.
 *
 * Le rôle n'est pas une étiquette : il détermine le chiffre mis en avant sur le compte
 * et la présence d'une checklist. Le formulaire l'explique, sinon le choix se fait au
 * hasard et l'écran du compte paraît arbitraire.
 */
const ROLES: { cle: RoleCompte; nom: string; effet: string }[] = [
  { cle: 'prelevements', nom: 'Prélèvements', effet: 'Charges mensuelles à cocher' },
  { cle: 'courant', nom: 'Courant', effet: 'Charges à cocher + budgets à dépenser' },
  { cle: 'provisions', nom: 'Provisions', effet: 'Charges annuelles, rien à cocher' },
]

export function FeuilleCompte({
  ouverte,
  onFermer,
  compte,
}: {
  ouverte: boolean
  onFermer: () => void
  compte?: CompteCalcule
}) {
  const queryClient = useQueryClient()
  const [nom, setNom] = useState('')
  const [banque, setBanque] = useState('')
  const [role, setRole] = useState<RoleCompte>('prelevements')
  const [couleur, setCouleur] = useState<CouleurCategorie>('bleu')

  useEffect(() => {
    if (!ouverte) return
    setNom(compte?.nom ?? '')
    setBanque(compte?.banque ?? '')
    setRole(compte?.role ?? 'prelevements')
    setCouleur((compte?.couleur as CouleurCategorie) ?? 'bleu')
  }, [ouverte, compte])

  const surSucces = (etat: EtatFoyer) => {
    queryClient.setQueryData(CLE_ETAT, etat)
    onFermer()
  }

  const enregistrement = useMutation({
    mutationFn: (saisie: { nom: string; banque: string; role: RoleCompte; couleur: string }) =>
      compte ? api.modifierCompte(compte.id, saisie) : api.creerCompte(saisie),
    onSuccess: surSucces,
  })

  const valide = nom.trim().length > 0

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3 }}>
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
          {compte ? 'Modifier le compte' : 'Nouveau compte'}
        </Typography>

        <TextField
          label="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 60 } }}
        />
        <TextField
          label="Banque"
          value={banque}
          onChange={(e) => setBanque(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 60 } }}
        />

        <TextField
          select
          label="Rôle"
          value={role}
          onChange={(e) => setRole(e.target.value as RoleCompte)}
          fullWidth
          helperText={ROLES.find((r) => r.cle === role)?.effet}
        >
          {ROLES.map((r) => (
            <MenuItem key={r.cle} value={r.cle}>
              {r.nom}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <Typography variant="libelle" sx={{ mb: 1 }}>
            Couleur
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={couleur}
            onChange={(_, v) => v && setCouleur(v as CouleurCategorie)}
            sx={{ flexWrap: 'wrap' }}
          >
            {(Object.keys(COULEURS_CATEGORIE) as CouleurCategorie[]).map((c) => (
              <ToggleButton key={c} value={c} sx={{ p: 1 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: `${RAYONS.puce}px`,
                    backgroundColor: COULEURS_CATEGORIE[c],
                  }}
                />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Button
          variant="contained"
          fullWidth
          disabled={!valide || enregistrement.isPending}
          onClick={() =>
            enregistrement.mutate({ nom: nom.trim(), banque: banque.trim(), role, couleur })
          }
        >
          {enregistrement.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </Stack>
    </Drawer>
  )
}
