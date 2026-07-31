import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { formatEuros } from '@shared/format.js'
import type { EtatFoyer } from '@shared/types.js'
import { useParams } from 'react-router-dom'
import { api, type SaisieBudget } from '../api/client.js'
import { Carte } from '../components/Carte.js'
import { DialogueConfirmation } from '../components/DialogueConfirmation.js'
import { PaveNumerique } from '../components/PaveNumerique.js'
import { TuileCategorie } from '../components/TuileCategorie.js'
import { CLE_ETAT, useEtat } from '../hooks/useEtat.js'
import { useRetour } from '../hooks/useRetour.js'
import { couleurDe, iconeDe } from '../icones.js'
import { COULEURS, RAYONS } from '../theme.js'

export function FormulaireBudget() {
  const { id } = useParams<{ id: string }>()
  const retour = useRetour('/budgets')
  const queryClient = useQueryClient()
  const { data: etat, isPending, isError } = useEtat()
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)

  const edition = id !== undefined
  const budgetExistant = edition
    ? etat?.comptes.flatMap((c) => c.budgets).find((b) => b.id === Number(id))
    : undefined

  const [nom, setNom] = useState(() => budgetExistant?.nom ?? '')
  const [montantCents, setMontantCents] = useState(
    () => budgetExistant?.montantMensuelCents ?? 0,
  )
  const [compteId, setCompteId] = useState(() => budgetExistant?.compteId ?? 0)
  const [categorieId, setCategorieId] = useState<number | null>(
    () => budgetExistant?.categorie?.id ?? null,
  )

  const surSucces = (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat)
  const creer = useMutation({ mutationFn: api.creerBudget, onSuccess: surSucces })
  const modifier = useMutation({
    mutationFn: ({ idBudget, saisie }: { idBudget: number; saisie: SaisieBudget }) =>
      api.modifierBudget(idBudget, saisie),
    onSuccess: surSucces,
  })
  const supprimer = useMutation({ mutationFn: api.supprimerBudget, onSuccess: surSucces })

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
  if (edition && !budgetExistant) return <Alert severity="error">Ce budget n'existe pas.</Alert>

  /**
   * Un budget vit sur un compte de dépenses courantes. On propose donc en priorité les
   * comptes `courant` : poser une enveloppe « courses » sur le compte d'épargne des
   * provisions n'aurait pas de sens, mais rien ne l'interdit si l'organisation diffère.
   */
  const comptesProposes = [
    ...etat.comptes.filter((c) => c.role === 'courant'),
    ...etat.comptes.filter((c) => c.role !== 'courant'),
  ]
  const compteChoisi = compteId || comptesProposes[0]?.id || 0
  const valide = nom.trim().length > 0 && montantCents > 0 && compteChoisi > 0

  const enregistrer = () => {
    if (!valide) return
    const saisie: SaisieBudget = {
      compteId: compteChoisi,
      categorieId,
      nom: nom.trim(),
      montantMensuelCents: montantCents,
    }
    if (edition && budgetExistant) {
      modifier.mutate({ idBudget: budgetExistant.id, saisie }, { onSuccess: retour })
    } else {
      creer.mutate(saisie, { onSuccess: retour })
    }
  }

  const enCours = creer.isPending || modifier.isPending

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={retour} sx={{ ml: -1 }} aria-label="Fermer">
          <CloseRoundedIcon />
        </IconButton>
        <Typography variant="h6">{edition ? 'Modifier le budget' : 'Nouveau budget'}</Typography>
      </Stack>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="montantHero" sx={{ opacity: montantCents === 0 ? 0.35 : 1 }}>
          {formatEuros(montantCents)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
          par mois — enveloppe à dépenser
        </Typography>
      </Box>

      <PaveNumerique valeurCents={montantCents} onChange={setMontantCents} />

      <TextField
        label="Nom"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        fullWidth
        slotProps={{ htmlInput: { maxLength: 60 } }}
      />

      <TextField
        select
        label="Compte"
        value={compteChoisi}
        onChange={(e) => setCompteId(Number(e.target.value))}
        fullWidth
      >
        {comptesProposes.map((compte) => (
          <MenuItem key={compte.id} value={compte.id}>
            {compte.nom} · {compte.banque}
          </MenuItem>
        ))}
      </TextField>

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

      <Carte sx={{ borderLeft: `3px solid ${COULEURS.bleu}` }}>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          {formatEuros(montantCents)}/mois s'ajoutent au virement permanent du compte. Un
          budget non dépensé n'est pas reporté au cycle suivant.
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
          Supprimer ce budget
        </Button>
      )}

      <DialogueConfirmation
        ouvert={confirmationSuppression}
        titre="Supprimer ce budget ?"
        message={
          budgetExistant
            ? `« ${budgetExistant.nom} » sera effacé, ainsi que ses ${budgetExistant.depenses.length} dépense(s). Le virement permanent du compte diminuera de ${formatEuros(budgetExistant.montantMensuelCents)}.`
            : ''
        }
        onConfirmer={() => {
          setConfirmationSuppression(false)
          if (budgetExistant) supprimer.mutate(budgetExistant.id, { onSuccess: retour })
        }}
        onAnnuler={() => setConfirmationSuppression(false)}
      />
    </Stack>
  )
}
