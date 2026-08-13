import { useState } from 'react'
import {
  Alert,
  Box,
  Divider,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { useNavigate } from 'react-router-dom'
import { coutAnnuel, coutMensuelLisse } from '@hamsterbudgeo/shared/calculs.js'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { ChargeCalculee, CompteCalcule } from '@hamsterbudgeo/shared/types.js'
import { BoutonAjouter } from '../components/BoutonAjouter.js'
import { Carte } from '../components/Carte.js'
import { PuceType } from '../components/PuceType.js'
import { TuileCategorie } from '../components/TuileCategorie.js'
import { useEtat } from '../hooks/useEtat.js'
import { couleurDe, iconeDe } from '../icones.js'

function Stat({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
        {libelle}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{valeur}</Typography>
    </Box>
  )
}

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
          <Typography sx={{ fontWeight: 600, mb: 0.25 }} noWrap>
            {charge.nom}
          </Typography>
          {/* Sur une charge annuelle, l'équivalent mensuel prend la place du jour de
              prélèvement : c'est lui qui alimente le virement permanent. */}
          {annuelle ? (
            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }} noWrap>
              soit {formatEuros(charge.coutMensuelLisseCents)}/mois
            </Typography>
          ) : (
            charge.jourPrelevement !== null && (
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }} noWrap>
                le {charge.jourPrelevement}
              </Typography>
            )
          )}
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Typography sx={{ fontWeight: 700 }}>{formatEuros(charge.montantCents)}</Typography>
          {/* La nature reste collée au montant : c'est elle qui empêche de lire
              540,00 € par an comme 540,00 € par mois. */}
          <PuceType type={charge.type} />
        </Stack>
      </Stack>
    </Carte>
  )
}

export function Charges() {
  const navigate = useNavigate()
  const { data: etat, isPending, isError } = useEtat()
  const [axe, setAxe] = useState<Groupement>('type')
  // Les groupes repliés, par clé. Tout est déplié au départ : masquer par défaut
  // ferait passer des charges inaperçues.
  const [replies, setReplies] = useState<Set<string>>(new Set())

  const basculer = (cle: string) =>
    setReplies((actuelles) => {
      const suivantes = new Set(actuelles)
      if (suivantes.has(cle)) suivantes.delete(cle)
      else suivantes.add(cle)
      return suivantes
    })

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
  const annuelTotal = toutes.reduce((s, c) => s + coutAnnuel(c), 0)
  const groupes = grouper(etat.comptes, axe)

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="titreSection">Mes charges</Typography>
        <BoutonAjouter label="Ajouter une charge" onClick={() => navigate('/charges/nouvelle')} />
      </Stack>

      <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
        <Stat libelle="Charges" valeur={String(toutes.length)} />
        <Stat libelle="Par mois" valeur={formatEuros(lisseTotal)} />
        <Stat libelle="Par an" valeur={formatEuros(annuelTotal)} />
      </Stack>

      <ToggleButtonGroup exclusive fullWidth value={axe} onChange={(_, v) => v && setAxe(v)}>
        <ToggleButton value="type">Par type</ToggleButton>
        <ToggleButton value="compte">Par compte</ToggleButton>
      </ToggleButtonGroup>

      {groupes.map((groupe) => {
        // Un groupe entièrement annuel se totalise à l'année : c'est le montant qui
        // sortira réellement. Vaut aussi pour le compte de provisions dans la vue
        // « Par compte », qui ne porte que des charges annuelles.
        const toutAnnuel = groupe.charges.every((c) => c.type === 'annuelle')
        const sousTotal = groupe.charges.reduce(
          (s, c) => s + (toutAnnuel ? coutAnnuel(c) : coutMensuelLisse(c)),
          0,
        )
        const replie = replies.has(groupe.cle)

        return (
          <Box key={groupe.cle}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              onClick={() => basculer(groupe.cle)}
              role="button"
              aria-expanded={!replie}
              sx={{ mb: 1.25, cursor: 'pointer', userSelect: 'none' }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                    transform: replie ? 'rotate(-90deg)' : 'none',
                    transition: 'transform 150ms ease',
                  }}
                />
                <Typography variant="libelle" noWrap>
                  {groupe.titre}
                </Typography>
              </Stack>
              <Typography variant="libelle" noWrap>
                {formatEuros(sousTotal)}/{toutAnnuel ? 'an' : 'mois'}
              </Typography>
            </Stack>

            {/* Rendu conditionnel plutôt qu'un Collapse animé : en repliant, sa
                hauteur tombe à zéro et Chrome laissait traîner la couche de
                composition du liseré de la première carte — une ligne fantôme qui ne
                partait qu'au repaint suivant. */}
            {!replie && (
              <Stack spacing={1.25}>
                {groupe.charges.map((charge) => (
                  <LigneChargeListe
                    key={charge.id}
                    charge={charge}
                    onClick={() => navigate(`/charges/${charge.id}`)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )
      })}

      {toutes.length === 0 && (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          Aucune charge enregistrée.
        </Typography>
      )}
    </Stack>
  )
}
