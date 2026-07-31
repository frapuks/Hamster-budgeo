import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate, formatEuros } from '@hamsterbudgeo/shared/format.js'
import { AnneauProgression } from '../components/AnneauProgression.js'
import { Carte } from '../components/Carte.js'
import { DialogueConfirmation } from '../components/DialogueConfirmation.js'
import { FeuilleDepense } from '../components/FeuilleDepense.js'
import { TuileCategorie } from '../components/TuileCategorie.js'
import { useEtat } from '../hooks/useEtat.js'
import { useRetour } from '../hooks/useRetour.js'
import { useSupprimerDepense } from '../hooks/useDepenses.js'
import { couleurDe, iconeDe } from '../icones.js'
import { COULEURS } from '../theme.js'

export function DetailBudget() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const retour = useRetour('/budgets')
  const { data: etat, isPending, isError } = useEtat()
  const supprimer = useSupprimerDepense()
  const [saisieOuverte, setSaisieOuverte] = useState(false)
  const [aSupprimer, setASupprimer] = useState<{ id: number; libelle: string } | null>(null)

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
        <Skeleton variant="rounded" height={64} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const budgets = etat.comptes.flatMap((c) => c.budgets)
  const budget = budgets.find((b) => b.id === Number(id))
  if (!budget) return <Alert severity="error">Ce budget n'existe pas.</Alert>

  const depasse = budget.resteADepenserCents < 0
  // L'anneau montre ce qui RESTE : plein à la première dépense près, vide une fois le
  // budget consommé. Un budget dépassé donne 0 %, l'anneau est alors entièrement creux.
  const proportionRestante =
    budget.montantMensuelCents > 0
      ? Math.max(0, Math.min(100, (budget.resteADepenserCents / budget.montantMensuelCents) * 100))
      : 0

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <IconButton onClick={retour} sx={{ ml: -1 }} aria-label="Retour">
          <ArrowBackRoundedIcon />
        </IconButton>
        <TuileCategorie
          Icone={iconeDe(budget.categorie?.icone)}
          couleur={couleurDe(budget.categorie?.couleur)}
          taille={36}
        />
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          {budget.nom}
        </Typography>
        <IconButton
          aria-label="Modifier le budget"
          onClick={() => navigate(`/budgets/${budget.id}/modifier`)}
        >
          <EditRoundedIcon />
        </IconButton>
      </Stack>

      <Box sx={{ display: 'grid', placeItems: 'center' }}>
        <AnneauProgression
          pourcentage={proportionRestante}
          valeur={formatEuros(budget.resteADepenserCents)}
          legende={depasse ? 'de dépassement' : 'restants'}
          taille={200}
          couleur={depasse ? COULEURS.corail : COULEURS.bleuClair}
        />
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          {formatEuros(budget.depenseCents)} dépensés sur {formatEuros(budget.montantMensuelCents)}
        </Typography>
      </Box>

      <Button variant="contained" fullWidth startIcon={<AddRoundedIcon />} onClick={() => setSaisieOuverte(true)}>
        Ajouter une dépense
      </Button>

      <Box>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="titreSection">Dépenses du cycle</Typography>
          <Typography variant="libelle">{budget.depenses.length}</Typography>
        </Stack>

        {budget.depenses.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            Aucune dépense enregistrée sur ce budget pour le moment.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {budget.depenses.map((depense) => (
              <Carte key={depense.id} sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {depense.libelle}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(depense.dateDepense)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatEuros(depense.montantCents)}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Supprimer ${depense.libelle}`}
                    onClick={() => setASupprimer({ id: depense.id, libelle: depense.libelle })}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Carte>
            ))}
          </Stack>
        )}
      </Box>

      <FeuilleDepense
        ouverte={saisieOuverte}
        onFermer={() => setSaisieOuverte(false)}
        budget={budget}
      />

      <DialogueConfirmation
        ouvert={aSupprimer !== null}
        titre="Supprimer cette dépense ?"
        message={`« ${aSupprimer?.libelle} » sera définitivement effacée. L'application ne garde aucun historique, cette action est irréversible.`}
        onConfirmer={() => {
          if (aSupprimer) supprimer.mutate(aSupprimer.id)
          setASupprimer(null)
        }}
        onAnnuler={() => setASupprimer(null)}
      />
    </Stack>
  )
}
