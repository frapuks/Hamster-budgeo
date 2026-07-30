import { useEffect, useState } from 'react'
import { Box, Button, Drawer, Stack, TextField, Typography } from '@mui/material'
import { formatEuros } from '@shared/format.js'
import type { BudgetCalcule } from '@shared/types.js'
import { useAjouterDepense } from '../hooks/useDepenses.js'
import { PaveNumerique } from './PaveNumerique.js'
import { TuileCategorie } from './TuileCategorie.js'
import { couleurDe, iconeDe } from '../icones.js'

/**
 * Feuille de saisie d'une dépense.
 *
 * Le budget est fixé par l'écran d'où l'on vient et n'est pas modifiable ici : on
 * ouvre la feuille depuis « Essence », on saisit une dépense d'essence. Proposer de
 * basculer vers « Restaurants » au moment de valider n'ouvre la porte qu'aux erreurs.
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

  // Réinitialisation à chaque ouverture : une feuille qui rouvre avec les valeurs
  // précédentes conduit à enregistrer deux fois la même dépense sans s'en apercevoir.
  useEffect(() => {
    if (ouverte) {
      setMontantCents(0)
      setLibelle('')
    }
  }, [ouverte])

  // Seul le montant est obligatoire : le libellé vide sera remplacé par le nom du
  // budget côté serveur. Une dépense d'essence s'appelle « Essence », c'est suffisant
  // et ça évite d'imposer une saisie de plus à la pompe.
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
