import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import {
  bilanCouple,
  deltaCompte,
  repartirSurComptes,
  verseSurCompte,
} from '@hamsterbudgeo/shared/calculs.js'
import { formatEuros } from '@hamsterbudgeo/shared/format.js'
import type { Contribution, EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { BoutonEdition } from '../components/BoutonEdition.js'
import { FeuilleSalaires } from '../components/FeuilleSalaires.js'
import { Carte } from '../components/Carte.js'
import { DialogueConfirmation } from '../components/DialogueConfirmation.js'
import { CarteMode, NOM_DU_MODE } from '../components/CartesModes.js'
import { FeuilleModeRepartition } from '../components/FeuilleModeRepartition.js'
import { Section } from '../components/Section.js'
import { useEtat, CLE_ETAT } from '../hooks/useEtat.js'
import { COULEURS, TEINTES_PERSONNE as TEINTES } from '../theme.js'

/**
 * Champ de montant en euros, enregistré à la sortie du champ plutôt qu'à chaque frappe :
 * enregistrer au fil de la saisie enverrait « 1 », « 12 », « 120 » et ferait clignoter
 * tous les totaux. Une saisie invalide revient à la valeur enregistrée.
 */
function ChampMontant({
  valeurCents,
  teinte,
  onEnregistrer,
  label,
}: {
  valeurCents: number
  teinte?: string
  onEnregistrer: (cents: number) => void
  label: string
}) {
  const [saisie, setSaisie] = useState(() => (valeurCents / 100).toFixed(2))

  // Le bouton « moitié-moitié » réécrit tous les montants d'un coup : sans cette
  // resynchronisation, les champs garderaient la valeur affichée avant le clic.
  useEffect(() => setSaisie((valeurCents / 100).toFixed(2)), [valeurCents])

  const valider = () => {
    const euros = Number(saisie.replace(',', '.'))
    if (Number.isFinite(euros) && euros >= 0) onEnregistrer(Math.round(euros * 100))
    else setSaisie((valeurCents / 100).toFixed(2))
  }

  return (
    <TextField
      value={saisie}
      onChange={(e) => setSaisie(e.target.value.replace(/[^0-9.,]/g, ''))}
      onBlur={valider}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      size="small"
      fullWidth
      slotProps={{
        htmlInput: { inputMode: 'decimal', 'aria-label': label },
        input: { endAdornment: <Typography variant="body2">€</Typography> },
      }}
      sx={teinte ? { '& .MuiOutlinedInput-root': { borderLeft: `3px solid ${teinte}` } } : undefined}
    />
  )
}

/** L'écart d'un compte, dit en toutes lettres : c'est ce qu'on vient vérifier ici. */
function EcartCompte({ deltaCents }: { deltaCents: number }) {
  const { texte, couleur } =
    deltaCents === 0
      ? { texte: 'compte équilibré', couleur: COULEURS.vert }
      : deltaCents < 0
        ? { texte: `il manque ${formatEuros(-deltaCents)}`, couleur: COULEURS.corail }
        : { texte: `${formatEuros(deltaCents)} en trop`, couleur: COULEURS.bleuClair }

  return (
    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: couleur }}>
      {texte}
    </Typography>
  )
}

function Resultat({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
        {libelle}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{valeur}</Typography>
    </Stack>
  )
}

export function Couple() {
  const queryClient = useQueryClient()
  const [feuilleSalaires, setFeuilleSalaires] = useState(false)
  const [feuilleMode, setFeuilleMode] = useState(false)
  const [confirmationRepartition, setConfirmationRepartition] = useState(false)
  const { data: etat, isPending, isError } = useEtat()

  const surSucces = (nouvelEtat: EtatFoyer) => queryClient.setQueryData(CLE_ETAT, nouvelEtat)
  const contributions = useMutation({
    mutationFn: (liste: Contribution[]) => api.enregistrerContributions(liste),
    onSuccess: surSucces,
  })

  if (isPending) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    )
  }

  if (isError) return <Alert severity="error">Impossible de charger tes données.</Alert>

  const { personnes, comptes, repartition } = etat
  const totalCharges = etat.totaux.virementPermanentCents
  const bilans = bilanCouple(personnes, etat.contributions, totalCharges)
  const totalVerse = bilans.reduce((s, b) => s + b.verseCents, 0)

  const montantDe = (personneId: number, compteId: number) =>
    etat.contributions.find((c) => c.personneId === personneId && c.compteId === compteId)
      ?.montantCents ?? 0

  return (
    <Stack spacing={3} sx={{ pb: 2 }}>
      <Typography variant="titreSection">Couple</Typography>

      <Section
        titre="Foyer"
        action={
          <BoutonEdition
            labelModifier="Modifier les salaires"
            onClick={() => setFeuilleSalaires(true)}
          />
        }
      >
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
          {personnes.map((personne, i) => (
            <Box key={personne.id} sx={{ flex: 1, px: 0.75, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ fontSize: '0.75rem', color: TEINTES[i % 2], fontWeight: 600 }}
              >
                {personne.prenom}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {formatEuros(personne.salaireNetCents)}
              </Typography>
            </Box>
          ))}

          <Box sx={{ flex: 1, px: 0.75, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              Charges
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatEuros(totalCharges)}</Typography>
          </Box>
        </Stack>
      </Section>

      <Section
        titre="Mode de répartition"
        action={
          <BoutonEdition
            labelModifier="Changer le mode de répartition"
            onClick={() => setFeuilleMode(true)}
          />
        }
      >
        <CarteMode
          mode={repartition.mode}
          personnes={personnes}
          totalCents={repartition.chargesCommunesCents}
        />

        {/* Posé sous la carte du mode plutôt que dans la ligne de titre : c'est la
            suite logique de lecture, le mode puis son application aux comptes. */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ArrowDownwardRoundedIcon sx={{ fontSize: 15 }} />}
          disabled={contributions.isPending}
          onClick={() => setConfirmationRepartition(true)}
          // Le thème impose 12 px de retrait vertical à tous les boutons, taillés pour
          // les actions principales. Celui-ci est secondaire et reste sur une ligne.
          sx={{ mt: 1.25, py: 0.625, fontSize: '0.8125rem' }}
        >
          Répartir automatiquement
        </Button>
      </Section>

      <Section titre="Virements compte par compte">
        <Stack spacing={1.25}>
          {comptes.map((compte) => (
            <Carte key={compte.id} sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }} noWrap>
                  {compte.nom}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {formatEuros(compte.virementPermanentCents)} attendus
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                {personnes.map((personne, i) => (
                  <Box key={personne.id} sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.6875rem', mb: 0.5 }}>
                      {personne.prenom}
                    </Typography>
                    <ChampMontant
                      label={`Virement de ${personne.prenom} sur ${compte.nom}`}
                      valeurCents={montantDe(personne.id, compte.id)}
                      teinte={TEINTES[i % 2]}
                      onEnregistrer={(cents) =>
                        contributions.mutate([
                          { personneId: personne.id, compteId: compte.id, montantCents: cents },
                        ])
                      }
                    />
                  </Box>
                ))}
              </Stack>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  versé {formatEuros(verseSurCompte(etat.contributions, compte.id))}
                </Typography>
                <EcartCompte deltaCents={deltaCompte(compte, etat.contributions)} />
              </Stack>
            </Carte>
          ))}
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5, px: 0.5 }}>
          <Typography sx={{ fontWeight: 700 }}>Total versé</Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {formatEuros(totalVerse)}
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              {' '}
              sur {formatEuros(totalCharges)}
            </Box>
          </Typography>
        </Stack>
      </Section>

      <Section titre="Résultats">
        <Stack spacing={1.25}>
          {bilans.map((bilan, i) => (
            <Carte
              key={bilan.personneId}
              sx={{ p: 1.75, borderLeft: `3px solid ${TEINTES[i % 2]}` }}
            >
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.25 }}>
                <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{bilan.prenom}</Typography>
                <Typography variant="montantCarte" sx={{ fontSize: '1.25rem' }}>
                  {formatEuros(bilan.verseCents)}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Resultat libelle="de son salaire" valeur={`${bilan.partDuSalaire.toFixed(1)} %`} />
                <Resultat
                  libelle="des charges communes"
                  valeur={`${bilan.partDesCharges.toFixed(1)} %`}
                />
                <Divider sx={{ my: 0.25 }} />
                <Resultat libelle="reste à vivre" valeur={formatEuros(bilan.resteAVivreCents)} />
              </Stack>
            </Carte>
          ))}
        </Stack>
      </Section>

      <DialogueConfirmation
        ouvert={confirmationRepartition}
        titre="Répartir automatiquement ?"
        message={`Tous les montants saisis seront écrasés et recalculés en « ${NOM_DU_MODE[repartition.mode].toLowerCase()} », compte par compte.`}
        libelleAction="Écraser et répartir"
        onConfirmer={() => {
          setConfirmationRepartition(false)
          contributions.mutate(repartirSurComptes(repartition.mode, personnes, comptes))
        }}
        onAnnuler={() => setConfirmationRepartition(false)}
      />

      <FeuilleSalaires
        ouverte={feuilleSalaires}
        onFermer={() => setFeuilleSalaires(false)}
        personnes={personnes}
      />

      <FeuilleModeRepartition
        ouverte={feuilleMode}
        onFermer={() => setFeuilleMode(false)}
        personnes={personnes}
        modeActif={repartition.mode}
        totalCents={repartition.chargesCommunesCents}
      />
    </Stack>
  )
}
