import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useNavigate } from 'react-router-dom'
import { coutMensuelLisse } from '@hamsterbudgeo/shared/calculs.js'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { ChargeCalculee, CompteCalcule } from '@hamsterbudgeo/shared/types.js'
import { Carte } from '../components/Carte.js'
import { PuceType } from '../components/PuceType.js'
import { TuileCategorie } from '../components/TuileCategorie.js'
import { useEtat } from '../hooks/useEtat.js'
import { couleurDe, iconeDe } from '../icones.js'

type Groupement = 'type' | 'compte'

interface Groupe {
  cle: string
  titre: string
  charges: ChargeCalculee[]
}

/**
 * Regroupe les charges selon l'axe choisi.
 *
 * Par type d'abord, parce que c'est la distinction structurante de l'application :
 * ce qui se coche chaque mois d'un côté, ce qui se provisionne à l'année de l'autre.
 */
function grouper(comptes: CompteCalcule[], axe: Groupement): Groupe[] {
  const toutes = comptes.flatMap((c) => c.charges.filter((ch) => ch.actif))

  if (axe === 'type') {
    return [
      { cle: 'mensuelle', titre: 'Charges mensuelles', charges: toutes.filter((c) => c.type === 'mensuelle') },
      { cle: 'annuelle', titre: 'Charges annuelles', charges: toutes.filter((c) => c.type === 'annuelle') },
    ].filter((g) => g.charges.length > 0)
  }

  return comptes
    .map((c) => ({
      cle: `compte-${c.id}`,
      titre: c.nom,
      charges: c.charges.filter((ch) => ch.actif),
    }))
    .filter((g) => g.charges.length > 0)
}

function LigneChargeListe({ charge, onClick }: { charge: ChargeCalculee; onClick: () => void }) {
  const annuelle = charge.type === 'annuelle'

  return (
    <Carte onClick={onClick} sx={{ p: 1.75, cursor: 'pointer' }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <TuileCategorie
          Icone={iconeDe(charge.categorie?.icone)}
          couleur={couleurDe(charge.categorie?.couleur)}
          taille={40}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
            <Typography sx={{ fontWeight: 600 }} noWrap>
              {charge.nom}
            </Typography>
            <PuceType type={charge.type} />
          </Stack>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }} noWrap>
            {charge.categorie?.nom ?? 'Sans catégorie'}
            {charge.jourPrelevement !== null && ` · le ${charge.jourPrelevement}`}
          </Typography>
        </Box>
        <Stack alignItems="flex-end">
          <Typography sx={{ fontWeight: 700 }}>{formatEuros(charge.montantCents)}</Typography>
          {/* Sur une charge annuelle, l'équivalent mensuel est le chiffre qui compte
              vraiment : c'est lui qui alimente le virement permanent. */}
          <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
            {annuelle ? `soit ${formatEuros(charge.coutMensuelLisseCents)}/mois` : 'par mois'}
          </Typography>
        </Stack>
      </Stack>
    </Carte>
  )
}

export function Charges() {
  const navigate = useNavigate()
  const { data: etat, isPending, isError } = useEtat()
  const [axe, setAxe] = useState<Groupement>('type')

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={70} />
        <Skeleton variant="rounded" height={44} />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={72} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const toutes = etat.comptes.flatMap((c) => c.charges.filter((ch) => ch.actif))
  const lisseTotal = toutes.reduce((s, c) => s + coutMensuelLisse(c), 0)
  const groupes = grouper(etat.comptes, axe)

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <Typography variant="titreSection">Mes charges</Typography>

      <Carte>
        <Typography variant="libelle" sx={{ mb: 0.5 }}>
          Coût mensuel lissé
        </Typography>
        <Typography variant="montantCarte">{formatEuros(lisseTotal)}/mois</Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', mt: 0.5 }}>
          {toutes.length} charges · c'est ce total qui détermine tes virements permanents
        </Typography>
      </Carte>

      <ToggleButtonGroup exclusive fullWidth value={axe} onChange={(_, v) => v && setAxe(v)}>
        <ToggleButton value="type">Par type</ToggleButton>
        <ToggleButton value="compte">Par compte</ToggleButton>
      </ToggleButtonGroup>

      {groupes.map((groupe) => {
        const sousTotal = groupe.charges.reduce((s, c) => s + coutMensuelLisse(c), 0)
        return (
          <Box key={groupe.cle}>
            <Stack
              direction="row"
              alignItems="baseline"
              justifyContent="space-between"
              sx={{ mb: 1.25 }}
            >
              <Typography variant="libelle">{groupe.titre}</Typography>
              <Typography variant="libelle">{formatEuros(sousTotal)}/mois</Typography>
            </Stack>
            <Stack spacing={1.25}>
              {groupe.charges.map((charge) => (
                <LigneChargeListe
                  key={charge.id}
                  charge={charge}
                  onClick={() => navigate(`/charges/${charge.id}`)}
                />
              ))}
            </Stack>
          </Box>
        )
      })}

      {toutes.length === 0 && (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          Aucune charge enregistrée.
        </Typography>
      )}

      <Button
        variant="outlined"
        fullWidth
        startIcon={<AddRoundedIcon />}
        onClick={() => navigate('/charges/nouvelle')}
      >
        Ajouter une charge
      </Button>
    </Stack>
  )
}
