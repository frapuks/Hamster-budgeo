import { Box, Stack, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { repartir } from '@hamsterbudgeo/shared/calculs.js'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { ModeRepartition, Personne } from '@hamsterbudgeo/shared/types.js'
import { Carte } from './Carte.js'
import { COULEURS, TEINTES_PERSONNE } from '../theme.js'

export const NOM_DU_MODE: Record<ModeRepartition, string> = {
  moitie: 'Moitié-moitié',
  prorata_revenus: 'Au prorata des revenus',
  reste_a_vivre_egal: 'Reste à vivre égal',
}

const MODES = Object.keys(NOM_DU_MODE) as ModeRepartition[]

/** Barre à deux segments, proportionnelle au partage. */
function BarrePartage({ parts }: { parts: number[] }) {
  const total = parts.reduce((s, p) => s + p, 0) || 1
  return (
    <Box sx={{ display: 'flex', height: 8, borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
      {parts.map((part, i) => (
        <Box key={i} sx={{ flex: `${part / total} 0 0`, backgroundColor: TEINTES_PERSONNE[i % 2] }} />
      ))}
    </Box>
  )
}

/**
 * Les trois modes, chacun montrant ce qu'il donnerait réellement.
 *
 * Le partage se recalcule pour tous les modes, pas seulement le mode actif : comparer
 * est justement ce qu'on vient faire ici, et un mode dont on ne voit pas le résultat ne
 * se choisit qu'au hasard.
 */
/**
 * Un mode, avec le partage qu'il donnerait.
 *
 * `actif` encadre la carte et la coche. Sans `onChoisir`, la carte n'est qu'un état
 * affiché : c'est ainsi que la page du couple montre le mode retenu, hors de toute
 * sélection.
 */
export function CarteMode({
  mode,
  personnes,
  totalCents,
  actif = false,
  onChoisir,
}: {
  mode: ModeRepartition
  personnes: Personne[]
  totalCents: number
  actif?: boolean
  onChoisir?: (mode: ModeRepartition) => void
}) {
  const parts = repartir(mode, personnes, totalCents)

  return (
    <Carte
      onClick={onChoisir && (() => onChoisir(mode))}
      sx={{
        cursor: onChoisir ? 'pointer' : 'default',
        borderColor: actif ? COULEURS.bleu : COULEURS.lisere,
        borderWidth: actif ? 2 : 1,
        position: 'relative',
      }}
    >
      {actif && onChoisir && (
        <CheckCircleRoundedIcon
          sx={{ position: 'absolute', top: 12, right: 12, color: COULEURS.bleu, fontSize: 20 }}
        />
      )}

      <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{NOM_DU_MODE[mode]}</Typography>

      <BarrePartage parts={parts.map((p) => p.partCents)} />

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25 }}>
        {parts.map((part, i) => (
          <Box key={part.personneId} sx={{ textAlign: i === 0 ? 'left' : 'right' }}>
            <Typography sx={{ fontWeight: 700, color: TEINTES_PERSONNE[i % 2] }}>
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
}

/** Les trois modes côte à côte, pour comparer avant de choisir. */
export function CartesModes({
  personnes,
  modeActif,
  totalCents,
  onChoisir,
}: {
  personnes: Personne[]
  modeActif: ModeRepartition
  totalCents: number
  onChoisir: (mode: ModeRepartition) => void
}) {
  return (
    <Stack spacing={1.5}>
      {MODES.map((cle) => (
        <CarteMode
          key={cle}
          mode={cle}
          personnes={personnes}
          totalCents={totalCents}
          actif={cle === modeActif}
          onChoisir={onChoisir}
        />
      ))}
    </Stack>
  )
}
