import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { ChargeCalculee, TypeCharge } from '@hamsterbudgeo/shared/types.js'
import { DialogueConfirmation } from './DialogueConfirmation.js'
import { PaveNumerique } from './PaveNumerique.js'
import { PoigneeFeuille } from './PoigneeFeuille.js'
import { SelecteurCategorie } from './SelecteurCategorie.js'
import { useEcrireCharge } from '../hooks/useCharges.js'
import { useEtat } from '../hooks/useEtat.js'

export function FeuilleCharge({
  ouverte,
  onFermer,
  charge,
}: {
  ouverte: boolean
  onFermer: () => void
  charge?: ChargeCalculee
}) {
  const { data: etat } = useEtat()
  const { creer, modifier, supprimer } = useEcrireCharge()

  const [nom, setNom] = useState('')
  const [type, setType] = useState<TypeCharge>('mensuelle')
  const [montantCents, setMontantCents] = useState(0)
  const [compteId, setCompteId] = useState(0)
  const [categorieId, setCategorieId] = useState<number | null>(null)
  const [jour, setJour] = useState(15)
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)

  // La feuille reste montée entre deux ouvertures : sans cette remise à zéro, elle
  // rouvrirait sur la charge précédente.
  useEffect(() => {
    if (!ouverte) return
    setNom(charge?.nom ?? '')
    setType(charge?.type ?? 'mensuelle')
    setMontantCents(charge?.montantCents ?? 0)
    setCompteId(charge?.compteId ?? 0)
    setCategorieId(charge?.categorie?.id ?? null)
    setJour(charge?.jourPrelevement ?? 15)
    setConfirmationSuppression(false)
  }, [ouverte, charge])

  if (!etat) return null

  const compteChoisi = compteId || etat.comptes[0]?.id || 0
  const valide = nom.trim().length > 0 && montantCents > 0 && compteChoisi > 0
  const enCours = creer.isPending || modifier.isPending

  const enregistrer = () => {
    if (!valide) return
    const saisie = {
      compteId: compteChoisi,
      categorieId,
      nom: nom.trim(),
      type,
      montantCents,
      jourPrelevement: type === 'mensuelle' ? jour : null,
    }
    if (charge) modifier.mutate({ id: charge.id, saisie }, { onSuccess: onFermer })
    else creer.mutate(saisie, { onSuccess: onFermer })
  }

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3, maxHeight: '88dvh', overflowY: 'auto' }}>
        <PoigneeFeuille
          titre={charge ? 'Modifier la charge' : 'Nouvelle charge'}
          onFermer={onFermer}
        />

        <ToggleButtonGroup
          exclusive
          fullWidth
          value={type}
          onChange={(_, v) => v && setType(v as TypeCharge)}
        >
          <ToggleButton value="mensuelle">Tous les mois</ToggleButton>
          <ToggleButton value="annuelle">Une fois par an</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="montantHero" sx={{ opacity: montantCents === 0 ? 0.35 : 1 }}>
            {formatEuros(montantCents)}
          </Typography>
          {/* L'unité est la seule chose qui distingue 600 €/mois de 600 €/an.
              Elle est teintée sur le cas annuel, le plus facile à mal lire. */}
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              fontWeight: 600,
              color: type === 'annuelle' ? '#FFC46B' : 'text.secondary',
            }}
          >
            {type === 'annuelle' ? 'par an' : 'par mois'}
          </Typography>
        </Box>

        <PaveNumerique valeurCents={montantCents} onChange={setMontantCents} />

        <TextField
          label="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />

        <TextField
          select
          label="Compte à débiter"
          value={compteChoisi}
          onChange={(e) => setCompteId(Number(e.target.value))}
          fullWidth
        >
          {etat.comptes.map((compte) => (
            <MenuItem key={compte.id} value={compte.id}>
              {compte.nom} · {compte.banque}
            </MenuItem>
          ))}
        </TextField>

        <SelecteurCategorie
          categories={etat.categories}
          valeur={categorieId}
          onChange={setCategorieId}
        />

        {type === 'mensuelle' && (
          <Box>
            <Typography variant="libelle" sx={{ mb: 1 }}>
              Jour de prélèvement
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={() => setJour((j) => Math.max(1, j - 1))}
                aria-label="Jour précédent"
              >
                <RemoveRoundedIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 700, minWidth: 56, textAlign: 'center' }}>
                le {jour}
              </Typography>
              <IconButton
                onClick={() => setJour((j) => Math.min(31, j + 1))}
                aria-label="Jour suivant"
              >
                <AddRoundedIcon />
              </IconButton>
            </Stack>
          </Box>
        )}

        <Button variant="contained" fullWidth disabled={!valide || enCours} onClick={enregistrer}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </Button>

        {charge && (
          <Button
            variant="text"
            color="error"
            fullWidth
            disabled={supprimer.isPending}
            onClick={() => setConfirmationSuppression(true)}
          >
            Supprimer cette charge
          </Button>
        )}
      </Stack>

      <DialogueConfirmation
        ouvert={confirmationSuppression}
        titre="Supprimer cette charge ?"
        message={`« ${charge?.nom} » sera définitivement effacée, et le virement permanent du compte diminuera d'autant.`}
        onConfirmer={() => {
          setConfirmationSuppression(false)
          if (charge) supprimer.mutate(charge.id, { onSuccess: onFermer })
        }}
        onAnnuler={() => setConfirmationSuppression(false)}
      />
    </Drawer>
  )
}
