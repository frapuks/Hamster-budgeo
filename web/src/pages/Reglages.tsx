import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatEuros } from '@shared/format.js'
import type { CompteCalcule, EtatFoyer } from '@shared/types.js'
import { api } from '../api/client.js'
import { Carte } from '../components/Carte.js'
import { DialogueConfirmation } from '../components/DialogueConfirmation.js'
import { FeuilleCompte } from '../components/FeuilleCompte.js'
import { TuileCategorie, COULEURS_CATEGORIE, type CouleurCategorie } from '../components/TuileCategorie.js'
import { useEtat, CLE_ETAT } from '../hooks/useEtat.js'
import { couleurDe, iconeDe } from '../icones.js'

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="libelle" sx={{ mb: 1.25 }}>
        {titre}
      </Typography>
      {children}
    </Box>
  )
}

const NOMS_ROLE: Record<string, string> = {
  prelevements: 'Prélèvements',
  courant: 'Courant',
  provisions: 'Provisions',
}

export function Reglages() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: etat, isPending, isError } = useEtat()

  const [compteEdite, setCompteEdite] = useState<CompteCalcule | undefined>()
  const [feuilleOuverte, setFeuilleOuverte] = useState(false)
  const [compteASupprimer, setCompteASupprimer] = useState<CompteCalcule | null>(null)
  const [confirmationEffacement, setConfirmationEffacement] = useState(false)
  const [confirmationDemo, setConfirmationDemo] = useState(false)

  const surSucces = (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat)
  const reordonner = useMutation({ mutationFn: api.reordonnerComptes, onSuccess: surSucces })
  const supprimerCompte = useMutation({ mutationFn: api.supprimerCompte, onSuccess: surSucces })
  const chargerDemo = useMutation({ mutationFn: api.chargerDemo, onSuccess: surSucces })
  const toutEffacer = useMutation({ mutationFn: api.toutEffacer, onSuccess: surSucces })

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  /** Déplace un compte d'un rang et renvoie la liste complète des identifiants. */
  const deplacer = (index: number, direction: -1 | 1) => {
    const ids = etat.comptes.map((c) => c.id)
    const cible = index + direction
    if (cible < 0 || cible >= ids.length) return
    ;[ids[index], ids[cible]] = [ids[cible]!, ids[index]!]
    reordonner.mutate(ids)
  }

  const ouvrirCompte = (compte?: CompteCalcule) => {
    setCompteEdite(compte)
    setFeuilleOuverte(true)
  }

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Typography variant="titreSection">Réglages</Typography>

      {/* Foyer -------------------------------------------------------------- */}
      <Section titre="Foyer">
        <Carte onClick={() => navigate('/repartition')} sx={{ cursor: 'pointer', p: 1.75 }}>
          <Stack spacing={1}>
            {etat.personnes.map((personne) => (
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

      {/* Comptes ------------------------------------------------------------ */}
      <Section titre="Comptes bancaires">
        <Stack spacing={1.25}>
          {etat.comptes.map((compte, index) => (
            <Carte key={compte.id} sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {/* Flèches plutôt que glisser-déposer : une heure de travail contre
                    une journée, et pour trois comptes la différence ne se voit pas. */}
                <Stack sx={{ mr: 0.5 }}>
                  <IconButton
                    size="small"
                    aria-label={`Monter ${compte.nom}`}
                    disabled={index === 0 || reordonner.isPending}
                    onClick={() => deplacer(index, -1)}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Descendre ${compte.nom}`}
                    disabled={index === etat.comptes.length - 1 || reordonner.isPending}
                    onClick={() => deplacer(index, 1)}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>

                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '999px',
                    backgroundColor:
                      COULEURS_CATEGORIE[(compte.couleur as CouleurCategorie) in COULEURS_CATEGORIE
                        ? (compte.couleur as CouleurCategorie)
                        : 'ardoise'],
                  }}
                />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {compte.nom}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }} noWrap>
                    {NOMS_ROLE[compte.role]} · {formatEuros(compte.virementPermanentCents)}/mois
                  </Typography>
                </Box>

                <IconButton size="small" aria-label={`Modifier ${compte.nom}`} onClick={() => ouvrirCompte(compte)}>
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={`Supprimer ${compte.nom}`}
                  onClick={() => setCompteASupprimer(compte)}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Carte>
          ))}

          <Button variant="outlined" fullWidth startIcon={<AddRoundedIcon />} onClick={() => ouvrirCompte()}>
            Ajouter un compte
          </Button>
        </Stack>
      </Section>

      {/* Catégories --------------------------------------------------------- */}
      <Section titre={`Catégories (${etat.categories.length})`}>
        <Carte sx={{ p: 1.75 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {etat.categories.map((categorie) => (
              <Box key={categorie.id} title={categorie.nom}>
                <TuileCategorie
                  Icone={iconeDe(categorie.icone)}
                  couleur={couleurDe(categorie.couleur)}
                  taille={40}
                />
              </Box>
            ))}
          </Box>
        </Carte>
      </Section>

      {/* Cycle -------------------------------------------------------------- */}
      <Section titre="Cycle">
        <Carte sx={{ p: 1.75 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AutorenewRoundedIcon sx={{ color: 'text.secondary' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>Dernier reset</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                le {formatDate(etat.foyer.dernierReset)}
              </Typography>
            </Box>
          </Stack>
        </Carte>
      </Section>

      {/* Données ------------------------------------------------------------ */}
      <Section titre="Données">
        <Stack spacing={1.25}>
          <Button variant="outlined" fullWidth onClick={() => setConfirmationDemo(true)}>
            Charger les données de démonstration
          </Button>
          <Button variant="text" color="error" fullWidth onClick={() => setConfirmationEffacement(true)}>
            Tout effacer et repartir de zéro
          </Button>
        </Stack>
      </Section>

      <FeuilleCompte
        ouverte={feuilleOuverte}
        onFermer={() => setFeuilleOuverte(false)}
        compte={compteEdite}
      />

      <DialogueConfirmation
        ouvert={compteASupprimer !== null}
        titre="Supprimer ce compte ?"
        message={
          compteASupprimer
            ? `« ${compteASupprimer.nom} » sera effacé, ainsi que ses ${compteASupprimer.charges.length} charge(s) et ${compteASupprimer.budgets.length} budget(s). Le total à virer chaque mois diminuera de ${formatEuros(compteASupprimer.virementPermanentCents)}.`
            : ''
        }
        onConfirmer={() => {
          if (compteASupprimer) supprimerCompte.mutate(compteASupprimer.id)
          setCompteASupprimer(null)
        }}
        onAnnuler={() => setCompteASupprimer(null)}
      />

      <DialogueConfirmation
        ouvert={confirmationDemo}
        titre="Charger les données de démonstration ?"
        message="Tes comptes, charges et budgets actuels seront remplacés par le jeu d'exemple. Cette action est irréversible."
        libelleAction="Charger la démonstration"
        onConfirmer={() => {
          setConfirmationDemo(false)
          chargerDemo.mutate()
        }}
        onAnnuler={() => setConfirmationDemo(false)}
      />

      <DialogueConfirmation
        ouvert={confirmationEffacement}
        titre="Tout effacer ?"
        message="Tous tes comptes, charges, budgets et dépenses seront supprimés. Les prénoms et les salaires du foyer sont conservés. Cette action est irréversible."
        libelleAction="Tout effacer"
        onConfirmer={() => {
          setConfirmationEffacement(false)
          toutEffacer.mutate()
        }}
        onAnnuler={() => setConfirmationEffacement(false)}
      />
    </Stack>
  )
}
