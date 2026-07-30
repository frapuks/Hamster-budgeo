import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useParams } from 'react-router-dom'
import { coutMensuelLisse } from '@shared/calculs.js'
import { formatEuros } from '@shared/format.js'
import type { TypeCharge } from '@shared/types.js'
import { Carte } from '../components/Carte.js'
import { DialogueConfirmation } from '../components/DialogueConfirmation.js'
import { PaveNumerique } from '../components/PaveNumerique.js'
import { TuileCategorie } from '../components/TuileCategorie.js'
import { useEcrireCharge } from '../hooks/useCharges.js'
import { useEtat } from '../hooks/useEtat.js'
import { useRetour } from '../hooks/useRetour.js'
import { couleurDe, iconeDe } from '../icones.js'
import { COULEURS, RAYONS } from '../theme.js'

export function FormulaireCharge() {
  const { id } = useParams<{ id: string }>()
  const retour = useRetour('/charges')
  const { data: etat, isPending, isError } = useEtat()
  const { creer, modifier, supprimer } = useEcrireCharge()
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)

  const edition = id !== undefined && id !== 'nouvelle'
  const chargeExistante = edition
    ? etat?.comptes.flatMap((c) => c.charges).find((c) => c.id === Number(id))
    : undefined

  // Initialisés une seule fois, à partir de la charge éditée le cas échéant.
  const [nom, setNom] = useState(() => chargeExistante?.nom ?? '')
  const [type, setType] = useState<TypeCharge>(() => chargeExistante?.type ?? 'mensuelle')
  const [montantCents, setMontantCents] = useState(() => chargeExistante?.montantCents ?? 0)
  const [compteId, setCompteId] = useState(() => chargeExistante?.compteId ?? 0)
  const [categorieId, setCategorieId] = useState<number | null>(
    () => chargeExistante?.categorie?.id ?? null,
  )
  const [jour, setJour] = useState(() => chargeExistante?.jourPrelevement ?? 1)

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={90} />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>
  if (edition && !chargeExistante) return <Alert severity="error">Cette charge n'existe pas.</Alert>

  const compteChoisi = compteId || etat.comptes[0]?.id || 0
  const valide = nom.trim().length > 0 && montantCents > 0 && compteChoisi > 0

  const saisie = {
    compteId: compteChoisi,
    categorieId,
    nom: nom.trim(),
    type,
    montantCents,
    jourPrelevement: type === 'mensuelle' ? jour : null,
  }

  const enregistrer = () => {
    if (!valide) return
    if (edition && chargeExistante) {
      modifier.mutate({ id: chargeExistante.id, saisie }, { onSuccess: retour })
    } else {
      creer.mutate(saisie, { onSuccess: retour })
    }
  }

  const enCours = creer.isPending || modifier.isPending
  const lisse = coutMensuelLisse({ type, montantCents })

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={retour} sx={{ ml: -1 }} aria-label="Fermer">
          <CloseRoundedIcon />
        </IconButton>
        <Typography variant="h6">{edition ? 'Modifier la charge' : 'Nouvelle charge'}</Typography>
      </Stack>

      {/* Type — c'est lui qui donne son sens au montant --------------------- */}
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={type}
        onChange={(_, v) => v && setType(v as TypeCharge)}
      >
        <ToggleButton value="mensuelle">Tous les mois</ToggleButton>
        <ToggleButton value="annuelle">Une fois par an</ToggleButton>
      </ToggleButtonGroup>

      {/* Montant, avec son unité juste dessous ------------------------------ */}
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
          {type === 'annuelle' ? 'par an — montant total sur l’année' : 'par mois'}
        </Typography>
      </Box>

      <PaveNumerique valeurCents={montantCents} onChange={setMontantCents} />

      <TextField label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} fullWidth
        slotProps={{ htmlInput: { maxLength: 80 } }} />

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

      {/* Catégorie --------------------------------------------------------- */}
      <Box>
        <Typography variant="libelle" sx={{ mb: 1 }}>
          Catégorie
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {etat.categories.map((categorie) => {
            const active = categorie.id === categorieId
            return (
              <Box
                key={categorie.id}
                onClick={() => setCategorieId(active ? null : categorie.id)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: `${RAYONS.tuile}px`,
                  outline: active ? `2px solid ${COULEURS.bleuClair}` : 'none',
                  outlineOffset: 2,
                }}
                title={categorie.nom}
              >
                <TuileCategorie
                  Icone={iconeDe(categorie.icone)}
                  couleur={couleurDe(categorie.couleur)}
                  taille={40}
                />
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Jour de prélèvement, sans objet sur une charge annuelle ------------- */}
      {type === 'mensuelle' && (
        <Box>
          <Typography variant="libelle" sx={{ mb: 1 }}>
            Jour de prélèvement
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => setJour((j) => Math.max(1, j - 1))} aria-label="Jour précédent">
              <RemoveRoundedIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700, minWidth: 56, textAlign: 'center' }}>
              le {jour}
            </Typography>
            <IconButton onClick={() => setJour((j) => Math.min(31, j + 1))} aria-label="Jour suivant">
              <AddRoundedIcon />
            </IconButton>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              sert uniquement à ordonner la liste
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Ce que ça change concrètement --------------------------------------- */}
      <Carte sx={{ borderLeft: `3px solid ${COULEURS.bleu}` }}>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          {type === 'annuelle'
            ? `Provision de ${formatEuros(lisse)}/mois — c'est ce montant qui s'ajoute au virement permanent du compte.`
            : `${formatEuros(montantCents)}/mois s'ajoutent au virement permanent du compte.`}
        </Typography>
      </Carte>

      <Button variant="contained" fullWidth disabled={!valide || enCours} onClick={enregistrer}>
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </Button>

      {edition && (
        <Button
          variant="text"
          color="error"
          fullWidth
          onClick={() => setConfirmationSuppression(true)}
        >
          Supprimer cette charge
        </Button>
      )}

      <DialogueConfirmation
        ouvert={confirmationSuppression}
        titre="Supprimer cette charge ?"
        message={`« ${chargeExistante?.nom} » sera définitivement effacée, et le virement permanent du compte diminuera d'autant.`}
        onConfirmer={() => {
          setConfirmationSuppression(false)
          if (chargeExistante) supprimer.mutate(chargeExistante.id, { onSuccess: retour })
        }}
        onAnnuler={() => setConfirmationSuppression(false)}
      />
    </Stack>
  )
}
