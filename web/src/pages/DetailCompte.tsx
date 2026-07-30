import { useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { useNavigate, useParams } from 'react-router-dom'
import { formatEuros } from '@shared/format.js'
import type { CompteCalcule } from '@shared/types.js'
import { LigneBudget } from '../components/LigneBudget.js'
import { LigneCharge } from '../components/LigneCharge.js'
import { VueProvisions } from '../components/VueProvisions.js'
import { useCocherCharge } from '../hooks/useCocherCharge.js'
import { useEtat } from '../hooks/useEtat.js'
import { useRetour } from '../hooks/useRetour.js'
import { proportionRestante } from '../proportions.js'

/** En-tête commun aux deux vues d'un compte. */
function EnTeteCompte({ compte, onRetour }: { compte: CompteCalcule; onRetour: () => void }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton onClick={onRetour} sx={{ ml: -1 }} aria-label="Retour">
        <ArrowBackRoundedIcon />
      </IconButton>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" noWrap>
          {compte.nom}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }} noWrap>
          {compte.banque}
        </Typography>
      </Box>
    </Stack>
  )
}

function StatCote({ libelle, montantCents }: { libelle: string; montantCents: number }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
        {libelle}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{formatEuros(montantCents)}</Typography>
    </Box>
  )
}

export function DetailCompte() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const retour = useRetour('/')
  const { data: etat, isPending, isError } = useEtat()
  const cocher = useCocherCharge()
  const [onglet, setOnglet] = useState<'charges' | 'budgets'>('charges')

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={72} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const compte = etat.comptes.find((c) => c.id === Number(id))
  if (!compte) return <Alert severity="error">Ce compte n'existe pas.</Alert>

  // Le compte d'épargne a sa propre logique : pas de checklist, un seul chiffre.
  if (compte.role === 'provisions') {
    return (
      <Stack spacing={3} sx={{ pb: 2 }}>
        <EnTeteCompte compte={compte} onRetour={retour} />
        <VueProvisions compte={compte} />
      </Stack>
    )
  }

  const mensuelles = compte.charges.filter((c) => c.type === 'mensuelle')
  const cochees = mensuelles.filter((c) => c.estPrelevee).length
  const progression = proportionRestante(compte.resteASortirCents, compte.totalDuCycleCents)

  // Un compte porte des budgets (rôle `courant`) ou n'en porte pas (rôle
  // `prelevements`). C'est cette présence, et non le rôle déclaré, qui décide de
  // l'affichage : un compte de prélèvements auquel on ajouterait un budget se
  // comporterait correctement sans code supplémentaire.
  const mixte = compte.budgets.length > 0
  const ongletActif = mixte ? onglet : 'charges'

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <EnTeteCompte compte={compte} onRetour={retour} />

      {/* Héros -------------------------------------------------------------- */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="libelle" sx={{ mb: 0.75 }}>
          {mixte ? 'Il doit encore couvrir' : 'Reste à sortir'}
        </Typography>
        <Typography variant="montantHero">
          {formatEuros(mixte ? compte.besoinDuCycleCents : compte.resteASortirCents)}
        </Typography>

        {mixte ? (
          // La décomposition est indispensable : le chiffre additionne deux natures
          // d'argent qui ne se suivent pas de la même façon, l'une se coche, l'autre
          // se décrémente. Sans cette ligne, le total paraîtrait sorti de nulle part.
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {formatEuros(compte.resteASortirCents)} de charges +{' '}
            {formatEuros(compte.resteADepenserCents)} de budgets
          </Typography>
        ) : (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            sx={{ mt: 1.5 }}
          >
            <StatCote libelle="Total" montantCents={compte.totalDuCycleCents} />
            <Divider orientation="vertical" flexItem />
            <StatCote libelle="Déjà prélevé" montantCents={compte.dejaPreleveCents} />
          </Stack>
        )}

        <LinearProgress
          variant="determinate"
          value={progression}
          color="secondary"
          sx={{ mt: 2 }}
        />

        <Chip
          size="small"
          icon={<AutorenewRoundedIcon sx={{ fontSize: 15 }} />}
          label={`Virement permanent ${formatEuros(compte.virementPermanentCents)}/mois`}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Sélecteur, seulement si le compte porte les deux natures ------------- */}
      {mixte && (
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={ongletActif}
          onChange={(_, v) => v && setOnglet(v)}
        >
          <ToggleButton value="charges">Charges ({mensuelles.length})</ToggleButton>
          <ToggleButton value="budgets">Budgets ({compte.budgets.length})</ToggleButton>
        </ToggleButtonGroup>
      )}

      {/* Charges ------------------------------------------------------------- */}
      {ongletActif === 'charges' &&
        (mensuelles.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            Aucune charge sur ce compte pour l'instant.
          </Typography>
        ) : (
          <Box>
            {!mixte && (
              <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="titreSection">Prélèvements du cycle</Typography>
                <Typography variant="libelle">
                  {cochees} sur {mensuelles.length}
                </Typography>
              </Stack>
            )}
            <Stack spacing={1.25}>
              {mensuelles.map((charge) => (
                <LigneCharge
                  key={charge.id}
                  charge={charge}
                  onBascule={(estPrelevee) => cocher.mutate({ id: charge.id, estPrelevee })}
                />
              ))}
            </Stack>
          </Box>
        ))}

      {/* Budgets -------------------------------------------------------------- */}
      {ongletActif === 'budgets' && (
        <Stack spacing={1.25}>
          {compte.budgets.map((budget) => (
            <LigneBudget
              key={budget.id}
              budget={budget}
              onClick={() => navigate(`/budgets/${budget.id}`)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
