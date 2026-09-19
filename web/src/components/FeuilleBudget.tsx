import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Drawer, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { BudgetCalcule, EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api, type SaisieBudget } from '../api/client.js'
import { DialogueConfirmation } from './DialogueConfirmation.js'
import { PaveNumerique } from './PaveNumerique.js'
import { PoigneeFeuille } from './PoigneeFeuille.js'
import { SelecteurCategorie } from './SelecteurCategorie.js'
import { CLE_ETAT, useEtat } from '../hooks/useEtat.js'

export function FeuilleBudget({
  ouverte,
  onFermer,
  budget,
  onSupprime,
}: {
  ouverte: boolean
  onFermer: () => void
  budget?: BudgetCalcule
  /** Appelé après une suppression, pour quitter un écran qui montrait ce budget. */
  onSupprime?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: etat } = useEtat()

  const [nom, setNom] = useState('')
  const [montantCents, setMontantCents] = useState(0)
  const [compteId, setCompteId] = useState(0)
  const [categorieId, setCategorieId] = useState<number | null>(null)
  const [confirmationSuppression, setConfirmationSuppression] = useState(false)

  // La feuille reste montée entre deux ouvertures : sans cette remise à zéro, elle
  // rouvrirait sur le budget précédent.
  useEffect(() => {
    if (!ouverte) return
    setNom(budget?.nom ?? '')
    setMontantCents(budget?.montantMensuelCents ?? 0)
    setCompteId(budget?.compteId ?? 0)
    setCategorieId(budget?.categorie?.id ?? null)
    setConfirmationSuppression(false)
  }, [ouverte, budget])

  const surSucces = (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat)
  const creer = useMutation({ mutationFn: api.creerBudget, onSuccess: surSucces })
  const modifier = useMutation({
    mutationFn: ({ idBudget, saisie }: { idBudget: number; saisie: SaisieBudget }) =>
      api.modifierBudget(idBudget, saisie),
    onSuccess: surSucces,
  })
  const supprimer = useMutation({ mutationFn: api.supprimerBudget, onSuccess: surSucces })

  if (!etat) return null

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
  const enCours = creer.isPending || modifier.isPending

  const enregistrer = () => {
    if (!valide) return
    const saisie: SaisieBudget = {
      compteId: compteChoisi,
      categorieId,
      nom: nom.trim(),
      montantMensuelCents: montantCents,
    }
    if (budget) modifier.mutate({ idBudget: budget.id, saisie }, { onSuccess: onFermer })
    else creer.mutate(saisie, { onSuccess: onFermer })
  }

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3, maxHeight: '88dvh', overflowY: 'auto' }}>
        <PoigneeFeuille titre={budget ? 'Modifier le budget' : 'Nouveau budget'} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="montantHero" sx={{ opacity: montantCents === 0 ? 0.35 : 1 }}>
            {formatEuros(montantCents)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
            par mois
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

        <SelecteurCategorie
          categories={etat.categories}
          valeur={categorieId}
          onChange={setCategorieId}
        />

        <Button variant="contained" fullWidth disabled={!valide || enCours} onClick={enregistrer}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </Button>

        {budget && (
          <Button
            variant="text"
            color="error"
            fullWidth
            disabled={supprimer.isPending}
            onClick={() => setConfirmationSuppression(true)}
          >
            Supprimer ce budget
          </Button>
        )}
      </Stack>

      <DialogueConfirmation
        ouvert={confirmationSuppression}
        titre="Supprimer ce budget ?"
        message={
          budget
            ? `« ${budget.nom} » sera effacé, ainsi que ses ${budget.depenses.length} dépense(s). Le virement permanent du compte diminuera de ${formatEuros(budget.montantMensuelCents)}.`
            : ''
        }
        onConfirmer={() => {
          setConfirmationSuppression(false)
          if (budget)
            supprimer.mutate(budget.id, {
              onSuccess: () => {
                onFermer()
                onSupprime?.()
              },
            })
        }}
        onAnnuler={() => setConfirmationSuppression(false)}
      />
    </Drawer>
  )
}
