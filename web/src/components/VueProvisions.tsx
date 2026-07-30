import { Box, Chip, Divider, Stack, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { totalAnnuel } from '@shared/calculs.js'
import { formatEuros } from '@shared/format.js'
import type { CompteCalcule } from '@shared/types.js'
import { couleurDe, iconeDe } from '../icones.js'
import { Carte } from './Carte.js'
import { TuileCategorie } from './TuileCategorie.js'

/**
 * Vue du compte d'épargne qui porte les charges annuelles.
 *
 * Volontairement sans case à cocher : quand l'eau tombe, l'argent part de l'épargne où
 * il attendait, ce qui ne change rien au reste à sortir du cycle. L'application n'a donc
 * pas besoin de le savoir, et une case à cocher ici n'apporterait qu'une corvée.
 *
 * Il n'y a qu'une seule action possible sur ce compte : faire le virement.
 */
export function VueProvisions({ compte }: { compte: CompteCalcule }) {
  const annuelles = compte.charges.filter((c) => c.type === 'annuelle' && c.actif)
  const couvertureAnnuelle = totalAnnuel(compte.charges)

  return (
    <Stack spacing={3}>
      {/* Héros : le seul chiffre qui compte ici --------------------------- */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="libelle" sx={{ mb: 0.75 }}>
          Virement permanent
        </Typography>
        <Typography variant="montantHero">
          {formatEuros(compte.provisionMensuelleCents)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          par mois, pour couvrir {formatEuros(couvertureAnnuelle)} de charges dans l'année
        </Typography>
        <Chip
          size="small"
          icon={<CheckRoundedIcon sx={{ fontSize: 15 }} />}
          label="Rien à cocher sur ce compte"
          sx={{ mt: 1.5 }}
        />
      </Box>

      {/* Détail des provisions -------------------------------------------- */}
      <Box>
        <Typography variant="titreSection" sx={{ mb: 1.5 }}>
          Ce que ça provisionne
        </Typography>

        {annuelles.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            Aucune charge annuelle sur ce compte pour l'instant.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {annuelles.map((charge) => (
              <Carte key={charge.id} sx={{ p: 1.75 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <TuileCategorie
                    Icone={iconeDe(charge.categorie?.icone)}
                    couleur={couleurDe(charge.categorie?.couleur)}
                    taille={40}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {charge.nom}
                    </Typography>
                    {/* L'unité est écrite en toutes lettres : c'est ce qui empêche de
                        lire 600,00 € par an comme 600,00 € par mois. */}
                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                      {formatEuros(charge.montantCents)} par an
                    </Typography>
                  </Box>
                  <Stack alignItems="flex-end">
                    <Typography variant="montantCarte" sx={{ fontSize: '1.125rem' }}>
                      {formatEuros(charge.coutMensuelLisseCents)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
                      par mois
                    </Typography>
                  </Stack>
                </Stack>
              </Carte>
            ))}
          </Stack>
        )}

        {annuelles.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ px: 0.5 }}>
              <Typography sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {formatEuros(couvertureAnnuelle)}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  /an ·{' '}
                </Box>
                {formatEuros(compte.provisionMensuelleCents)}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  /mois
                </Box>
              </Typography>
            </Stack>
          </>
        )}
      </Box>

      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
        Cet argent dort sur ton épargne et génère des intérêts jusqu'au prélèvement.
      </Typography>
    </Stack>
  )
}
