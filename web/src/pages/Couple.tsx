import { Alert, Box, Divider, Skeleton, Stack, Typography } from '@mui/material'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useNavigate } from 'react-router-dom'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import { Carte } from '../components/Carte.js'
import { Section } from '../components/Section.js'
import { useEtat } from '../hooks/useEtat.js'

const NOMS_MODE: Record<string, string> = {
  moitie: 'Moitié-moitié',
  prorata_revenus: 'Au prorata des revenus',
  reste_a_vivre_egal: 'Reste à vivre égal',
}

/**
 * Tout ce qui se règle à deux : qui gagne quoi, ce que chacun vire, comment la charge
 * commune se partage. Ces trois blocs vivaient dispersés entre l'accueil et les
 * réglages alors qu'ils ne répondent qu'à une seule question.
 */
export function Couple() {
  const navigate = useNavigate()
  const { data: etat, isPending, isError } = useEtat()

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={130} />
        <Skeleton variant="rounded" height={80} />
        <Skeleton variant="rounded" height={110} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const { personnes, repartition, totaux } = etat

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Typography variant="titreSection">Couple</Typography>

      <Section titre="Foyer">
        <Carte onClick={() => navigate('/repartition')} sx={{ cursor: 'pointer', p: 1.75 }}>
          <Stack spacing={1}>
            {personnes.map((personne) => (
              <Stack key={personne.id} direction="row" alignItems="center" spacing={1.5}>
                <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{personne.prenom}</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatEuros(personne.salaireNetCents)}
                </Typography>
              </Stack>
            ))}
            <Divider />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', flexGrow: 1 }}>
                Modifier les salaires et le mode de répartition
              </Typography>
              <ChevronRightRoundedIcon sx={{ color: 'text.secondary' }} />
            </Stack>
          </Stack>
        </Carte>
      </Section>

      <Section titre="Virements permanents">
        <Carte onClick={() => navigate('/virements')} sx={{ cursor: 'pointer' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>Ce que chacun vire</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                Les ordres à créer une fois dans ta banque
              </Typography>
            </Box>
            <Typography variant="montantCarte" sx={{ fontSize: '1.125rem' }}>
              {formatEuros(totaux.virementPermanentCents)}
            </Typography>
            <ChevronRightRoundedIcon sx={{ color: 'text.secondary' }} />
          </Stack>
        </Carte>
      </Section>

      <Section titre="Répartition du couple">
        <Carte onClick={() => navigate('/repartition')} sx={{ cursor: 'pointer' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              {/* Le mode plutôt que les prénoms : ceux-ci sont déjà juste au-dessus,
                  et c'est le mode qui explique les parts affichées en dessous. */}
              <Typography sx={{ fontWeight: 600 }}>{NOMS_MODE[repartition.mode]}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                sur {formatEuros(repartition.chargesCommunesCents)} de charges communes
              </Typography>
            </Box>
            <ChevronRightRoundedIcon sx={{ color: 'text.secondary' }} />
          </Stack>

          <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
            {repartition.parts.map((part) => (
              <Box key={part.personneId} sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {part.prenom}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatEuros(part.partCents)}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
                  reste {formatEuros(part.resteAVivreCents)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Carte>
      </Section>
    </Stack>
  )
}
