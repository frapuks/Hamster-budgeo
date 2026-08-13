import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { Categorie, CompteCalcule, EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api, ErreurApi } from '../api/client.js'
import { BoutonAjouter } from '../components/BoutonAjouter.js'
import { Carte } from '../components/Carte.js'
import { Section } from '../components/Section.js'
import { DialogueConfirmation } from '../components/DialogueConfirmation.js'
import { FeuilleCategorie } from '../components/FeuilleCategorie.js'
import { FeuilleCompte } from '../components/FeuilleCompte.js'
import { FeuilleNouveauCycle } from '../components/FeuilleNouveauCycle.js'
import { TuileCategorie, COULEURS_CATEGORIE, type CouleurCategorie } from '../components/TuileCategorie.js'
import { useEtat, CLE_ETAT } from '../hooks/useEtat.js'
import { couleurDe, iconeDe } from '../icones.js'
import { COULEURS, RAYONS } from '../theme.js'

/**
 * Action d'en-tête de section. Texte cliquable plutôt qu'un Button : celui-ci porte
 * 12 px de retrait vertical dans le thème, ce qui étirerait la ligne de titre.
 */
function ActionTexte({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Typography
      component="button"
      variant="libelle"
      onClick={onClick}
      sx={{
        background: 'none',
        border: 'none',
        p: 0,
        cursor: 'pointer',
        color: COULEURS.bleuClair,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </Typography>
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
  const [cycleOuvert, setCycleOuvert] = useState(false)
  const [categorieOuverte, setCategorieOuverte] = useState(false)
  const [categorieASupprimer, setCategorieASupprimer] = useState<Categorie | null>(null)
  const [editionCategories, setEditionCategories] = useState(false)

  const surSucces = (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat)
  const reordonner = useMutation({ mutationFn: api.reordonnerComptes, onSuccess: surSucces })
  const reordonnerBudgets = useMutation({
    mutationFn: api.reordonnerBudgets,
    onSuccess: surSucces,
  })
  const supprimerCategorie = useMutation({
    mutationFn: api.supprimerCategorie,
    onSuccess: surSucces,
  })
  const invitation = useMutation({ mutationFn: api.creerInvitation })

  /**
   * Déconnexion, suivie d'un rechargement complet de la page.
   *
   * Vider le cache ne suffisait pas : l'écran courant restait monté et déclenchait
   * aussitôt une lecture refusée, affichant une erreur au lieu de l'écran de connexion.
   * Un rechargement repart d'un état propre, cache et navigation compris — c'est aussi
   * le comportement attendu d'une déconnexion.
   */
  const deconnexion = useMutation({
    mutationFn: api.deconnexion,
    onSuccess: () => window.location.assign('/'),
  })

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

  const budgets = etat.comptes.flatMap((c) => c.budgets).sort((a, b) => a.ordre - b.ordre)
  const nomDuCompte = (compteId: number) =>
    etat.comptes.find((c) => c.id === compteId)?.nom ?? ''

  const deplacerBudget = (index: number, direction: -1 | 1) => {
    const ids = budgets.map((b) => b.id)
    const cible = index + direction
    if (cible < 0 || cible >= ids.length) return
    ;[ids[index], ids[cible]] = [ids[cible]!, ids[index]!]
    reordonnerBudgets.mutate(ids)
  }

  /** Charges et budgets rattachés à une catégorie. */
  const utilisations = (categorieId: number) =>
    etat.comptes.flatMap((c) => c.charges).filter((c) => c.categorie?.id === categorieId).length +
    etat.comptes.flatMap((c) => c.budgets).filter((b) => b.categorie?.id === categorieId).length

  /**
   * Une catégorie que rien n'utilise part sans confirmation : il n'y a rien à perdre,
   * et la recréer coûte deux clics. Dès qu'elle classe quelque chose, on demande.
   */
  const retirerCategorie = (categorie: Categorie) => {
    if (utilisations(categorie.id) === 0) supprimerCategorie.mutate(categorie.id)
    else setCategorieASupprimer(categorie)
  }

  const ouvrirCompte = (compte?: CompteCalcule) => {
    setCompteEdite(compte)
    setFeuilleOuverte(true)
  }

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Typography variant="titreSection">Réglages</Typography>

      <Section
        titre="Comptes bancaires"
        action={<BoutonAjouter label="Ajouter un compte" onClick={() => ouvrirCompte()} />}
      >
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
              </Stack>
            </Carte>
          ))}
        </Stack>
      </Section>

      <Section
        titre="Budgets"
        action={<BoutonAjouter label="Ajouter un budget" onClick={() => navigate('/budgets/nouveau')} />}
      >
        <Stack spacing={1.25}>
          {budgets.map((budget, index) => (
            <Carte key={budget.id} sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Stack sx={{ mr: 0.5 }}>
                  <IconButton
                    size="small"
                    aria-label={`Monter ${budget.nom}`}
                    disabled={index === 0 || reordonnerBudgets.isPending}
                    onClick={() => deplacerBudget(index, -1)}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Descendre ${budget.nom}`}
                    disabled={index === budgets.length - 1 || reordonnerBudgets.isPending}
                    onClick={() => deplacerBudget(index, 1)}
                    sx={{ p: 0.25 }}
                  >
                    <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>

                <TuileCategorie
                  Icone={iconeDe(budget.categorie?.icone)}
                  couleur={couleurDe(budget.categorie?.couleur)}
                  taille={32}
                />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {budget.nom}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }} noWrap>
                    {formatEuros(budget.montantMensuelCents)}/mois · {nomDuCompte(budget.compteId)}
                  </Typography>
                </Box>

                {/* Pas d'icône de suppression ici : elle vit dans le formulaire, avec sa
                    confirmation, et la dupliquer reviendrait à dupliquer le dialogue. */}
                <IconButton
                  size="small"
                  aria-label={`Modifier ${budget.nom}`}
                  onClick={() => navigate(`/budgets/${budget.id}/modifier`)}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Carte>
          ))}

          {budgets.length === 0 && (
            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
              Aucun budget pour l'instant.
            </Typography>
          )}
        </Stack>
      </Section>

      <Section
        titre={`Catégories (${etat.categories.length})`}
        action={
          <ActionTexte onClick={() => setEditionCategories((e) => !e)}>
            {editionCategories ? 'Terminer' : 'Modifier'}
          </ActionTexte>
        }
      >
        <Carte sx={{ p: 1.75 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {etat.categories.map((categorie) => (
              <Box key={categorie.id} title={categorie.nom} sx={{ position: 'relative' }}>
                <TuileCategorie
                  Icone={iconeDe(categorie.icone)}
                  couleur={couleurDe(categorie.couleur)}
                  taille={40}
                />

                {editionCategories && (
                  <Box
                    role="button"
                    aria-label={`Supprimer ${categorie.nom}`}
                    onClick={() => retirerCategorie(categorie)}
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '999px',
                      backgroundColor: COULEURS.corail,
                      color: '#FFF',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      boxShadow: `0 0 0 2px ${COULEURS.surface}`,
                    }}
                  >
                    <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                  </Box>
                )}
              </Box>
            ))}

            <Box
              onClick={() => setCategorieOuverte(true)}
              aria-label="Ajouter une catégorie"
              sx={{
                width: 40,
                height: 40,
                borderRadius: `${RAYONS.tuile}px`,
                border: `1px dashed ${COULEURS.lisereFort}`,
                color: 'text.secondary',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: COULEURS.bleuClair, color: COULEURS.bleuClair },
              }}
            >
              <AddRoundedIcon fontSize="small" />
            </Box>
          </Box>
        </Carte>
      </Section>

      <Section titre="Cycle">
        <Stack spacing={1.25}>
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

          <Button
            variant="outlined"
            fullWidth
            startIcon={<AutorenewRoundedIcon />}
            onClick={() => setCycleOuvert(true)}
          >
            Nouveau cycle — tout décocher
          </Button>
        </Stack>
      </Section>

      <Section titre="Mon compte">
        <Stack spacing={1.25}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PersonAddRoundedIcon />}
            disabled={invitation.isPending}
            onClick={() => invitation.mutate()}
          >
            Inviter mon conjoint
          </Button>

          {invitation.isSuccess && (
            <Carte sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', mb: 1 }}>
                Transmets ce code à {invitation.data.prenom}. Il ouvre l'accès aux mêmes
                données, avec les mêmes droits.
              </Typography>
              <Typography
                variant="montantCarte"
                sx={{ letterSpacing: '0.25em', color: 'bleuClair' }}
              >
                {invitation.data.code}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.6875rem', mt: 1 }}>
                Valable 7 jours
              </Typography>
            </Carte>
          )}

          {invitation.isError && (
            <Alert severity="error">
              {invitation.error instanceof ErreurApi
                ? invitation.error.message
                : 'Invitation impossible.'}
            </Alert>
          )}

          <Button variant="text" fullWidth onClick={() => deconnexion.mutate()}>
            Se déconnecter
          </Button>
        </Stack>
      </Section>

      <DialogueConfirmation
        ouvert={categorieASupprimer !== null}
        titre="Supprimer cette catégorie ?"
        message={
          categorieASupprimer
            ? `« ${categorieASupprimer.nom} » sera effacée. ${utilisations(categorieASupprimer.id)} élément(s) garderont leur montant mais perdront ce classement.`
            : ''
        }
        onConfirmer={() => {
          if (categorieASupprimer) supprimerCategorie.mutate(categorieASupprimer.id)
          setCategorieASupprimer(null)
        }}
        onAnnuler={() => setCategorieASupprimer(null)}
      />

      <FeuilleCategorie
        ouverte={categorieOuverte}
        onFermer={() => setCategorieOuverte(false)}
      />

      <FeuilleNouveauCycle
        ouverte={cycleOuvert}
        onFermer={() => setCycleOuvert(false)}
        etat={etat}
      />

      <FeuilleCompte
        ouverte={feuilleOuverte}
        onFermer={() => setFeuilleOuverte(false)}
        compte={compteEdite}
      />


    </Stack>
  )
}
