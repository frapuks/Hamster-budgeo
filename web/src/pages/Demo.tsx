import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LocalGasStationRoundedIcon from '@mui/icons-material/LocalGasStationRounded'
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded'
import WifiRoundedIcon from '@mui/icons-material/WifiRounded'
import { formatEuros } from '@shared/format.js'
import { AnneauProgression } from '../components/AnneauProgression.js'
import { PuceStatut } from '../components/PuceStatut.js'
import { PuceType, TYPES, type TypeElement } from '../components/PuceType.js'
import { TuileCategorie, type CouleurCategorie } from '../components/TuileCategorie.js'
import { COULEURS, RAYONS } from '../theme.js'

// ── Briques réutilisables ────────────────────────────────────────────────────

/** Surface standard : marine clair, liseré discret. */
function Carte({
  children,
  sx = {},
  onClick,
}: {
  children: React.ReactNode
  sx?: object
  onClick?: () => void
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: 'background.paper',
        border: `1px solid ${COULEURS.lisere}`,
        // Jamais de nombre : dans `sx`, un nombre multiplie theme.shape.borderRadius.
        borderRadius: `${RAYONS.carte}px`,
        p: 2.25,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

/** Surface bleu plein : réservée à l'élément mis en avant d'une série. */
function CarteBleue({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        backgroundColor: COULEURS.bleu,
        borderRadius: `${RAYONS.carte}px`,
        p: 2.25,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

function EnTeteSection({ titre, action }: { titre: string; action?: string }) {
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Typography variant="titreSection">{titre}</Typography>
      {action && <Typography variant="libelle">{action}</Typography>}
    </Stack>
  )
}

// ── Données de démonstration ─────────────────────────────────────────────────

const IMMINENTES = [
  { nom: 'Loyer', quand: 'Dans 2 jours, le 10', cents: 85000, icone: HomeRoundedIcon, couleur: 'bleu', statut: 'a_venir' },
  { nom: 'Internet', quand: 'Dans 7 jours, le 15', cents: 3999, icone: WifiRoundedIcon, couleur: 'turquoise', statut: 'a_venir' },
  { nom: 'EDF', quand: 'Prélevé le 5', cents: 9640, icone: BoltRoundedIcon, couleur: 'ambre', statut: 'preleve' },
] as const

const CHECKLIST = [
  { nom: 'Loyer', cat: 'Logement', jour: 10, cents: 85000, icone: HomeRoundedIcon, couleur: 'bleu', coche: false },
  { nom: 'Internet', cat: 'Télécom', jour: 15, cents: 3999, icone: WifiRoundedIcon, couleur: 'turquoise', coche: false },
  { nom: 'Salle de sport', cat: 'Sport', jour: 18, cents: 2900, icone: FitnessCenterRoundedIcon, couleur: 'violet', coche: false },
  { nom: 'EDF', cat: 'Énergie', jour: 5, cents: 9640, icone: BoltRoundedIcon, couleur: 'ambre', coche: true },
] as const

/** Les trois natures, telles qu'elles apparaîtront dans la liste « Mes charges ». */
const NATURES = [
  {
    type: 'mensuelle' as TypeElement,
    nom: 'Loyer',
    cents: 85000,
    detail: 'le 10 · Logement',
    icone: HomeRoundedIcon,
    couleur: 'bleu',
    lisse: null,
  },
  {
    type: 'annuelle' as TypeElement,
    nom: 'Eau',
    cents: 60000,
    detail: 'Épargne provisions',
    icone: WaterDropRoundedIcon,
    couleur: 'turquoise',
    lisse: 5000,
  },
  {
    type: 'budget' as TypeElement,
    nom: 'Courses',
    cents: 40000,
    detail: '312,00 € déjà dépensés',
    icone: ShoppingCartRoundedIcon,
    couleur: 'citron',
    lisse: null,
  },
] as const

const BUDGETS = [
  { nom: 'Courses', dep: 31200, total: 40000, icone: ShoppingCartRoundedIcon, couleur: 'citron' },
  { nom: 'Essence', dep: 7800, total: 40000, icone: LocalGasStationRoundedIcon, couleur: 'bleu' },
  { nom: 'Loisirs', dep: 13200, total: 12000, icone: RestaurantRoundedIcon, couleur: 'corail' },
] as const

// ── Page ─────────────────────────────────────────────────────────────────────

export function Demo() {
  const [coches, setCoches] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST.map((c) => [c.nom, c.coche])),
  )
  const [filtre, setFiltre] = useState('toutes')
  const [sheetOuvert, setSheetOuvert] = useState(false)
  const [dialogOuvert, setDialogOuvert] = useState(false)

  return (
    <Stack spacing={4} sx={{ pb: 4 }}>
      <Box>
        <Typography variant="h5">Démonstration du thème</Typography>
        <Typography variant="body2">
          Lot 0 bis — identité visuelle à valider avant de construire les écrans.
        </Typography>
      </Box>

      {/* Bloc héros ------------------------------------------------------- */}
      <Stack alignItems="center" spacing={1.5}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="libelle" sx={{ mb: 0.75 }}>
            Reste à sortir
          </Typography>
          <Typography variant="montantHero">{formatEuros(135182)}</Typography>
        </Box>
        <Chip
          size="small"
          icon={<AutorenewRoundedIcon sx={{ fontSize: 15 }} />}
          label="Dernier reset le 01/07/2025"
        />
      </Stack>

      {/* Anneau de progression -------------------------------------------- */}
      <Carte sx={{ p: 3 }}>
        <Typography variant="titreSection" sx={{ mb: 0.5 }}>
          Compte prélèvements
        </Typography>
        <Typography variant="montantHero" sx={{ fontSize: '2rem' }}>
          {formatEuros(125155)}
        </Typography>
        <Typography variant="body2">restant à prélever ce cycle</Typography>
        <Box sx={{ display: 'grid', placeItems: 'center', mt: 2.5 }}>
          <AnneauProgression pourcentage={14} valeur="14 %" legende="Déjà prélevé" />
        </Box>
      </Carte>

      {/* Actions rapides --------------------------------------------------- */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
        {[
          { libelle: 'Ajouter', Icone: AddRoundedIcon, actif: true },
          { libelle: 'Dépense', Icone: ShoppingCartRoundedIcon, actif: false },
          { libelle: 'Virement', Icone: SwapHorizRoundedIcon, actif: false },
        ].map(({ libelle, Icone, actif }) => (
          <Carte key={libelle} sx={{ p: 2, textAlign: 'center' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                mx: 'auto',
                mb: 1,
                borderRadius: `${RAYONS.tuile}px`,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: actif ? COULEURS.bleu : 'rgba(255,255,255,0.06)',
              }}
            >
              <Icone sx={{ color: actif ? '#FFF' : COULEURS.bleuClair }} />
            </Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{libelle}</Typography>
          </Carte>
        ))}
      </Box>

      {/* Cartes de compte -------------------------------------------------- */}
      <Box>
        <EnTeteSection titre="Mes comptes" action="Tout voir" />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <CarteBleue>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', mb: 0.75 }}>
              Compte prélèvements
            </Typography>
            <Typography variant="montantCarte" sx={{ color: '#FFF', mb: 0.5 }}>
              {formatEuros(125155)}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
              9 charges · 3 cochées
            </Typography>
          </CarteBleue>

          <Carte>
            <Typography variant="libelle" sx={{ mb: 0.75 }}>
              Épargne provisions
            </Typography>
            <Typography variant="montantCarte" sx={{ mb: 0.5 }}>
              {formatEuros(12250)}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              à virer ce cycle
            </Typography>
          </Carte>
        </Box>
      </Box>

      {/* Charges imminentes ------------------------------------------------ */}
      <Box>
        <EnTeteSection titre="Charges imminentes" action="7 jours" />
        <Stack spacing={1.25}>
          {IMMINENTES.map((c) => (
            <Carte key={c.nom} sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <TuileCategorie Icone={c.icone} couleur={c.couleur as CouleurCategorie} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{c.nom}</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    {c.quand}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end" spacing={0.5}>
                  <Typography sx={{ fontWeight: 700 }}>−{formatEuros(c.cents)}</Typography>
                  <PuceStatut statut={c.statut} />
                </Stack>
              </Stack>
            </Carte>
          ))}
        </Stack>
      </Box>

      {/* Les trois natures -------------------------------------------------- */}
      <Box>
        <EnTeteSection titre="Les trois natures" />
        <Stack spacing={1.25}>
          {NATURES.map((n) => (
            <Carte key={n.nom} sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <TuileCategorie Icone={n.icone} couleur={n.couleur as CouleurCategorie} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
                    <Typography sx={{ fontWeight: 600 }}>{n.nom}</Typography>
                    <PuceType type={n.type} />
                  </Stack>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    {n.detail}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end">
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatEuros(n.cents)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
                    {n.lisse ? `soit ${formatEuros(n.lisse)}/mois` : TYPES[n.type].unite}
                  </Typography>
                </Stack>
              </Stack>
            </Carte>
          ))}
        </Stack>
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', mt: 1.5 }}>
          L'unité sous le montant n'est pas décorative : c'est elle qui empêche de lire
          600,00 € par an comme 600,00 € par mois.
        </Typography>
      </Box>

      {/* Recherche + filtres ----------------------------------------------- */}
      <Box>
        <EnTeteSection titre="Toutes les charges" />
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            placeholder="Rechercher une charge ou une catégorie…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={filtre}
            onChange={(_, v) => v && setFiltre(v)}
          >
            <ToggleButton value="toutes">Toutes</ToggleButton>
            <ToggleButton value="attente">À venir</ToggleButton>
            <ToggleButton value="payees">Prélevées</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Checklist --------------------------------------------------------- */}
      <Stack spacing={1.25}>
        {CHECKLIST.map((c) => {
          const coche = coches[c.nom] ?? false
          return (
            <Carte
              key={c.nom}
              sx={{ p: 1.5, cursor: 'pointer', opacity: coche ? 0.55 : 1 }}
              onClick={() => setCoches((s) => ({ ...s, [c.nom]: !coche }))}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Checkbox checked={coche} disableRipple />
                <TuileCategorie Icone={c.icone} couleur={c.couleur as CouleurCategorie} taille={40} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 600, textDecoration: coche ? 'line-through' : 'none' }}
                  >
                    {c.nom}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    {c.cat} · le {c.jour}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end" spacing={0.5}>
                  <Typography
                    sx={{ fontWeight: 700, textDecoration: coche ? 'line-through' : 'none' }}
                  >
                    {formatEuros(c.cents)}
                  </Typography>
                  <PuceStatut statut={coche ? 'preleve' : 'a_venir'} />
                </Stack>
              </Stack>
            </Carte>
          )
        })}
      </Stack>

      {/* Budgets ----------------------------------------------------------- */}
      <Box>
        <EnTeteSection titre="Mes budgets" />
        <Stack spacing={1.5}>
          {BUDGETS.map((b) => {
            const restant = b.total - b.dep
            const depasse = restant < 0
            return (
              <Carte key={b.nom}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <TuileCategorie Icone={b.icone} couleur={b.couleur as CouleurCategorie} taille={40} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{b.nom}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                      {formatEuros(b.dep)} sur {formatEuros(b.total)}
                    </Typography>
                  </Box>
                  <Stack alignItems="flex-end">
                    <Typography
                      variant="montantCarte"
                      sx={{ fontSize: '1.25rem', color: depasse ? 'error.main' : 'bleuClair' }}
                    >
                      {formatEuros(restant)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.6875rem' }}>
                      {depasse ? 'dépassement' : 'restants'}
                    </Typography>
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (b.dep / b.total) * 100)}
                  color={depasse ? 'error' : 'secondary'}
                />
              </Carte>
            )
          })}
        </Stack>
      </Box>

      {/* Carte de mise en avant -------------------------------------------- */}
      <CarteBleue sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="titreSection" sx={{ color: '#FFF' }}>
              Virement permanent
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5, mb: 2 }}>
              Mets en place {formatEuros(128525)} par mois sur ce compte et tu n'y touches plus.
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: alpha('#FFFFFF', 0.92),
                color: COULEURS.bleu,
                '&:hover': { backgroundColor: '#FFF' },
              }}
            >
              Voir les virements
            </Button>
          </Box>
          <SavingsRoundedIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.35)' }} />
        </Stack>
      </CarteBleue>

      {/* Boutons et saisie -------------------------------------------------- */}
      <Box>
        <EnTeteSection titre="Contrôles" />
        <Stack spacing={1.5}>
          <Button variant="contained" fullWidth>
            Enregistrer
          </Button>
          <Button variant="outlined" fullWidth startIcon={<AutorenewRoundedIcon />}>
            Nouveau cycle — tout décocher
          </Button>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSheetOuvert(true)} fullWidth>
              Bottom sheet
            </Button>
            <Button variant="outlined" onClick={() => setDialogOuvert(true)} fullWidth>
              Confirmation
            </Button>
          </Stack>
          <TextField label="Nom" defaultValue="Salle de sport" fullWidth />
          <Alert severity="success">Virement permanent en place.</Alert>
          <Alert severity="error">Le budget Loisirs est dépassé de 12,00 €.</Alert>
        </Stack>
      </Box>

      {/* Surfaces flottantes ------------------------------------------------ */}
      <Drawer anchor="bottom" open={sheetOuvert} onClose={() => setSheetOuvert(false)}>
        <Stack spacing={2} sx={{ p: 3, pb: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: '999px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              mx: 'auto',
            }}
          />
          <Typography variant="libelle" sx={{ textAlign: 'center' }}>
            Nouvelle dépense
          </Typography>
          <Typography variant="montantHero" sx={{ textAlign: 'center' }}>
            {formatEuros(7800)}
          </Typography>
          <TextField label="Libellé" defaultValue="Total Wasquehal" fullWidth />
          <Stack direction="row" spacing={1}>
            <TuileCategorie Icone={LocalGasStationRoundedIcon} couleur="bleu" taille={40} />
            <TuileCategorie Icone={ShoppingCartRoundedIcon} couleur="citron" taille={40} />
            <TuileCategorie Icone={WaterDropRoundedIcon} couleur="turquoise" taille={40} />
          </Stack>
          <Button variant="contained" fullWidth onClick={() => setSheetOuvert(false)}>
            Enregistrer
          </Button>
        </Stack>
      </Drawer>

      <Dialog open={dialogOuvert} onClose={() => setDialogOuvert(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Démarrer un nouveau cycle</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Toutes les charges seront décochées et les dépenses effacées. Cette action est
            définitive, il n'y a pas d'historique.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
          <Button variant="contained" fullWidth onClick={() => setDialogOuvert(false)}>
            Démarrer le nouveau cycle
          </Button>
          <Button variant="text" fullWidth onClick={() => setDialogOuvert(false)}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
