import { useQuery } from '@tanstack/react-query'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { formatEuros, formatMoisCourt } from '@hamsterbudgeo/shared/format.js'
import type { MoisBudget } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { COULEURS, RAYONS } from '../theme.js'

const HAUTEUR = 72
const MOIS_AFFICHES = 6

/**
 * Les mois précédant le mois courant, du plus ancien au plus récent.
 *
 * Le mois courant est exclu : son cycle n'est pas clos, et la barre partielle qu'il
 * donnerait se lirait comme une baisse des dépenses.
 */
function moisPrecedents(combien: number): string[] {
  const maintenant = new Date()
  return Array.from({ length: combien }, (_, i) => {
    const d = new Date(Date.UTC(maintenant.getFullYear(), maintenant.getMonth() - combien + i, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
  })
}

interface Colonne {
  mois: string
  /** Absent : aucun cycle n'a été clos sur ce mois-là. */
  archive?: MoisBudget
}

/**
 * Une barre par mois, sur une grille fixe de six mois.
 *
 * Hauteur rapportée au plus gros montant de la série, plafonds compris : ramener chaque
 * barre à son propre plafond les rendrait toutes comparables à rien, et un mois à 400 €
 * ressemblerait à un mois à 40 €.
 */
function Barres({ colonnes }: { colonnes: Colonne[] }) {
  const maximum = Math.max(
    ...colonnes.flatMap((c) =>
      c.archive ? [c.archive.depenseCents, c.archive.plafondCents] : [],
    ),
    1,
  )

  return (
    <Stack direction="row" spacing={0.75} alignItems="flex-end" sx={{ height: HAUTEUR + 34 }}>
      {colonnes.map(({ mois, archive }) => {
        const depasse = archive !== undefined && archive.depenseCents > archive.plafondCents

        return (
          <Stack
            key={mois}
            spacing={0.5}
            alignItems="center"
            sx={{ flex: 1, minWidth: 0, opacity: archive ? 1 : 0.4 }}
            title={
              archive
                ? `${formatEuros(archive.depenseCents)} sur ${formatEuros(archive.plafondCents)} budgétés`
                : 'Aucun cycle clos sur ce mois'
            }
          >
            {/* Un tiret, pas « 0,00 € » : un mois sans archive n'est pas un mois sans
                dépense, et l'afficher à zéro ferait croire à une économie. */}
            <Typography variant="body2" sx={{ fontSize: '0.5625rem' }} noWrap>
              {archive ? formatEuros(archive.depenseCents) : '—'}
            </Typography>

            <Box
              sx={{
                width: '100%',
                height: HAUTEUR,
                display: 'flex',
                alignItems: 'flex-end',
                borderRadius: `${RAYONS.puce}px`,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              {archive && (
                <Box
                  sx={{
                    width: '100%',
                    height: `${Math.max(2, (archive.depenseCents / maximum) * HAUTEUR)}px`,
                    borderRadius: `${RAYONS.puce}px`,
                    backgroundColor: depasse ? COULEURS.corail : COULEURS.vert,
                  }}
                />
              )}
            </Box>

            <Typography variant="body2" sx={{ fontSize: '0.625rem' }} noWrap>
              {formatMoisCourt(mois)}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

export function HistoriqueBudget({ budgetId }: { budgetId: number }) {
  // Clé distincte de celle de l'état : l'historique est en lecture seule et aucune
  // mutation ne le renvoie.
  const { data, isPending } = useQuery({
    queryKey: ['historique', budgetId],
    queryFn: () => api.getHistoriqueBudget(budgetId),
  })

  if (isPending) return <Skeleton variant="rounded" height={120} />

  const parMois = new Map((data?.mois ?? []).map((m) => [m.mois, m]))
  const colonnes: Colonne[] = moisPrecedents(MOIS_AFFICHES).map((mois) => ({
    mois,
    archive: parMois.get(mois),
  }))

  const renseignes = colonnes.filter((c) => c.archive !== undefined)

  if (renseignes.length === 0) {
    return (
      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
        L'historique se remplira au premier nouveau cycle.
      </Typography>
    )
  }

  // La moyenne ne porte que sur les mois connus : y compter les mois sans archive la
  // tirerait vers le bas sans raison.
  const moyenne = Math.round(
    renseignes.reduce((s, c) => s + c.archive!.depenseCents, 0) / renseignes.length,
  )

  return (
    <Box>
      <Barres colonnes={colonnes} />
      <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 1 }}>
        {formatEuros(moyenne)} en moyenne sur {renseignes.length} mois
      </Typography>
    </Box>
  )
}
