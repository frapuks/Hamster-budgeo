import { useState } from 'react'
import {
  Alert,
  Box,
  Divider,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import EastRoundedIcon from '@mui/icons-material/EastRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { useNavigate } from 'react-router-dom'
import { formatEuros } from '@shared/format.js'
import { Carte } from '../components/Carte.js'
import { useEtat } from '../hooks/useEtat.js'
import { useRetour } from '../hooks/useRetour.js'
import { COULEURS, RAYONS } from '../theme.js'

const TEINTES = ['#B98CFF', '#4ECDC4']

const NOMS_MODE: Record<string, string> = {
  moitie: 'moitié-moitié',
  prorata_revenus: 'au prorata des revenus',
  reste_a_vivre_egal: 'à reste à vivre égal',
}

/**
 * Bouton de copie d'un montant.
 *
 * Copie la valeur brute (« 1458.76 ») et non le montant formaté : c'est ce qu'attend
 * un champ de saisie bancaire, où l'espace des milliers et le symbole € sont refusés.
 */
function BoutonCopier({ cents, onCopie }: { cents: number; onCopie: () => void }) {
  return (
    <IconButton
      size="small"
      aria-label="Copier le montant"
      onClick={(e) => {
        e.stopPropagation()
        void navigator.clipboard.writeText((cents / 100).toFixed(2))
        onCopie()
      }}
    >
      <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  )
}

export function Virements() {
  const retour = useRetour('/')
  const navigate = useNavigate()
  const { data: etat, isPending, isError } = useEtat()
  const [copie, setCopie] = useState(false)

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const { repartition, comptes, totaux } = etat

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={retour} sx={{ ml: -1 }} aria-label="Retour">
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box>
          <Typography variant="h6">Virements permanents</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            À configurer une fois dans ton appli bancaire, puis n'y touche plus
          </Typography>
        </Box>
      </Stack>

      {/* Ce que chacun vire -------------------------------------------------- */}
      <Box>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.25 }}>
          <Typography variant="libelle">Ce que chacun vire</Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            onClick={() => navigate('/repartition')}
            sx={{ cursor: 'pointer' }}
          >
            <TuneRoundedIcon sx={{ fontSize: 14, color: COULEURS.bleuClair }} />
            <Typography variant="libelle" sx={{ color: COULEURS.bleuClair }}>
              {NOMS_MODE[repartition.mode]}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={1.25}>
          {repartition.parts.map((part, i) => (
            <Carte key={part.personneId} sx={{ p: 1.75, borderLeft: `3px solid ${TEINTES[i % 2]}` }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
                  {part.prenom}
                </Typography>
                <EastRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="montantCarte" sx={{ fontSize: '1.25rem' }}>
                  {formatEuros(part.partCents)}
                </Typography>
                <BoutonCopier cents={part.partCents} onCopie={() => setCopie(true)} />
              </Stack>
            </Carte>
          ))}
        </Stack>
      </Box>

      {/* Ce que reçoit chaque compte ------------------------------------------ */}
      <Box>
        <Typography variant="libelle" sx={{ mb: 1.25 }}>
          Ce que reçoit chaque compte
        </Typography>
        <Stack spacing={1.25}>
          {comptes.map((compte) => (
            <Carte key={compte.id} sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {compte.nom}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }} noWrap>
                    {compte.banque}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatEuros(compte.virementPermanentCents)}
                </Typography>
                <BoutonCopier
                  cents={compte.virementPermanentCents}
                  onCopie={() => setCopie(true)}
                />
              </Stack>
            </Carte>
          ))}
        </Stack>

        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
          <Typography sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {formatEuros(totaux.virementPermanentCents)}
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              /mois
            </Box>
          </Typography>
        </Stack>
      </Box>

      {/* L'explication qui évite la question « d'où sort ce chiffre ? » -------- */}
      <Box
        sx={{
          borderRadius: `${RAYONS.tuile}px`,
          borderLeft: `3px solid ${COULEURS.bleu}`,
          backgroundColor: 'rgba(255,255,255,0.04)',
          p: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          Ces montants sont lissés : ils incluent déjà les provisions des charges
          annuelles. Ils ne changent que si tu modifies une charge ou un budget — pas
          quand tu coches un prélèvement.
        </Typography>
      </Box>

      <Snackbar
        open={copie}
        autoHideDuration={2000}
        onClose={() => setCopie(false)}
        message="Montant copié"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Stack>
  )
}
