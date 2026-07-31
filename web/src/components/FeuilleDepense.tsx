import { useEffect, useState } from 'react'
import { Box, Button, Drawer, Stack, TextField, Typography } from '@mui/material'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { BudgetCalcule } from '@hamsterbudgeo/shared/types.js'
import { useAjouterDepense } from '../hooks/useDepenses.js'
import { PaveNumerique } from './PaveNumerique.js'
import { TuileCategorie } from './TuileCategorie.js'
import { couleurDe, iconeDe } from '../icones.js'

/**
 * Le budget est fixé par l'écran d'où l'on vient et n'est pas modifiable ici : proposer
 * d'en changer au moment de valider n'ouvrirait la porte qu'aux erreurs.
 */
export function FeuilleDepense({
  ouverte,
  onFermer,
  budget,
}: {
  ouverte: boolean
  onFermer: () => void
  budget: BudgetCalcule
}) {
  const [montantCents, setMontantCents] = useState(0)
  const [libelle, setLibelle] = useState('')
  const ajouter = useAjouterDepense()

  // Réinitialiser à chaque ouverture : sinon la feuille rouvre avec les valeurs
  // précédentes et la même dépense est enregistrée deux fois sans qu'on le voie.
  useEffect(() => {
    if (ouverte) {
      setMontantCents(0)
      setLibelle('')
    }
  }, [ouverte])

  // Seul le montant est obligatoire : un libellé vide prend le nom du budget.
  const valide = montantCents > 0

  const enregistrer = () => {
    if (!valide) return
    ajouter.mutate(
      { budgetId: budget.id, depense: { libelle: libelle.trim(), montantCents } },
      { onSuccess: onFermer },
    )
  }

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

        <Stack direction="row" alignItems="center" spacing={1.25} justifyContent="center">
          <TuileCategorie
            Icone={iconeDe(budget.categorie?.icone)}
            couleur={couleurDe(budget.categorie?.couleur)}
            taille={28}
          />
          <Typography variant="libelle">Nouvelle dépense · {budget.nom}</Typography>
        </Stack>

        <Typography
          variant="montantHero"
          sx={{ textAlign: 'center', opacity: montantCents === 0 ? 0.35 : 1 }}
        >
          {formatEuros(montantCents)}
        </Typography>

        <PaveNumerique valeurCents={montantCents} onChange={setMontantCents} />

        <TextField
          label="Libellé (facultatif)"
          placeholder={budget.nom}
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 80 }, inputLabel: { shrink: true } }}
        />

        <Button
          variant="contained"
          fullWidth
          disabled={!valide || ajouter.isPending}
          onClick={enregistrer}
        >
          {ajouter.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </Stack>
    </Drawer>
  )
}
