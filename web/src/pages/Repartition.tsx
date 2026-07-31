import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { repartir } from '@hamsterbudgeo/shared/calculs.js'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { EtatFoyer, ModeRepartition } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { Carte } from '../components/Carte.js'
import { useEtat, CLE_ETAT } from '../hooks/useEtat.js'
import { useRetour } from '../hooks/useRetour.js'
import { COULEURS, RAYONS } from '../theme.js'

const MODES: { cle: ModeRepartition; nom: string; explication: string }[] = [
  { cle: 'moitie', nom: 'Moitié-moitié', explication: 'Chacun paye la même somme' },
  {
    cle: 'prorata_revenus',
    nom: 'Au prorata des revenus',
    explication: 'Chacun paye à hauteur de ce qu’il gagne',
  },
  {
    cle: 'reste_a_vivre_egal',
    nom: 'Reste à vivre égal',
    explication: 'Il reste la même somme à chacun',
  },
]

const TEINTES = ['#B98CFF', '#4ECDC4']

/** Barre à deux segments, proportionnelle au partage. */
function BarrePartage({ parts }: { parts: number[] }) {
  const total = parts.reduce((s, p) => s + p, 0) || 1
  return (
    <Box sx={{ display: 'flex', height: 8, borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
      {parts.map((part, i) => (
        <Box key={i} sx={{ flex: `${part / total} 0 0`, backgroundColor: TEINTES[i % 2] }} />
      ))}
    </Box>
  )
}

/** Saisie d'un salaire, enregistrée à la sortie du champ plutôt qu'à chaque frappe. */
function CartePersonne({
  prenom,
  salaireCents,
  teinte,
  onEnregistrer,
}: {
  prenom: string
  salaireCents: number
  teinte: string
  onEnregistrer: (cents: number) => void
}) {
  const [saisie, setSaisie] = useState(() => String(Math.round(salaireCents / 100)))

  const valider = () => {
    const euros = Number(saisie.replace(',', '.'))
    if (Number.isFinite(euros) && euros >= 0) {
      onEnregistrer(Math.round(euros * 100))
    } else {
      setSaisie(String(Math.round(salaireCents / 100)))
    }
  }

  return (
    <Carte sx={{ flex: 1, borderTop: `3px solid ${teinte}` }}>
      <Typography variant="libelle" sx={{ mb: 1 }}>
        {prenom}
      </Typography>
      <TextField
        value={saisie}
        onChange={(e) => setSaisie(e.target.value.replace(/[^0-9.,]/g, ''))}
        onBlur={valider}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        size="small"
        fullWidth
        slotProps={{ input: { endAdornment: <Typography variant="body2">€</Typography> } }}
      />
      <Typography variant="body2" sx={{ fontSize: '0.6875rem', mt: 0.75 }}>
        net par mois
      </Typography>
    </Carte>
  )
}

export function Repartition() {
  const retour = useRetour('/')
  const queryClient = useQueryClient()
  const { data: etat, isPending, isError } = useEtat()

  const surSucces = (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat)
  const salaire = useMutation({
    mutationFn: ({ id, cents }: { id: number; cents: number }) => api.modifierSalaire(id, cents),
    onSuccess: surSucces,
  })
  const mode = useMutation({
    mutationFn: (m: ModeRepartition) => api.definirModeRepartition(m),
    onSuccess: surSucces,
  })

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={110} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={120} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const total = etat.repartition.chargesCommunesCents

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={retour} sx={{ ml: -1 }} aria-label="Retour">
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="h6">Répartition du couple</Typography>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        {etat.personnes.map((personne, i) => (
          <CartePersonne
            key={personne.id}
            prenom={personne.prenom}
            salaireCents={personne.salaireNetCents}
            teinte={TEINTES[i % 2]!}
            onEnregistrer={(cents) => salaire.mutate({ id: personne.id, cents })}
          />
        ))}
      </Stack>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="libelle" sx={{ mb: 0.75 }}>
          Charges communes du foyer
        </Typography>
        <Typography variant="montantHero" sx={{ fontSize: '2rem' }}>
          {formatEuros(total)}/mois
        </Typography>
        {/* Le total réparti est le lissé, pas le réel du cycle : sinon la part de
            chacun changerait tous les mois, incompatible avec un virement permanent. */}
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          montants lissés — c'est la somme des virements permanents
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {MODES.map(({ cle, nom, explication }) => {
          const parts = repartir(cle, etat.personnes, total)
          const actif = cle === etat.repartition.mode

          return (
            <Carte
              key={cle}
              onClick={() => mode.mutate(cle)}
              sx={{
                cursor: 'pointer',
                borderColor: actif ? COULEURS.bleu : COULEURS.lisere,
                borderWidth: actif ? 2 : 1,
                position: 'relative',
              }}
            >
              {actif && (
                <CheckCircleRoundedIcon
                  sx={{ position: 'absolute', top: 12, right: 12, color: COULEURS.bleu, fontSize: 20 }}
                />
              )}

              <Typography sx={{ fontWeight: 700, mb: 0.25 }}>{nom}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1.5 }}>
                {explication}
              </Typography>

              <BarrePartage parts={parts.map((p) => p.partCents)} />

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25 }}>
                {parts.map((part, i) => (
                  <Box key={part.personneId} sx={{ textAlign: i === 0 ? 'left' : 'right' }}>
                    <Typography sx={{ fontWeight: 700, color: TEINTES[i % 2] }}>
                      {formatEuros(part.partCents)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
                      {part.prenom} · reste {formatEuros(part.resteAVivreCents)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Carte>
          )
        })}
      </Stack>

      <Box sx={{ borderRadius: `${RAYONS.tuile}px`, p: 1.5, backgroundColor: 'rgba(255,255,255,0.04)' }}>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          « Reste » désigne ce qu'il te reste à vivre une fois ta part des charges communes
          versée. C'est le chiffre qui rend la discussion possible.
        </Typography>
      </Box>

      <Button variant="contained" fullWidth onClick={retour}>
        Terminé
      </Button>
    </Stack>
  )
}
