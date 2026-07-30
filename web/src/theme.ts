import { createTheme, alpha } from '@mui/material/styles'

/**
 * Thème de HamsterBudgeo — source unique du style.
 *
 * Règle du projet : aucun fichier CSS parallèle, aucune couleur ni rayon écrit en dur
 * dans un composant. Tout passe par ce thème ou par la prop `sx`.
 *
 * Direction visuelle : bleu marine profond, surfaces marine clair cernées d'un liseré
 * discret, un seul bleu vif pour les actions, et les montants importants en lavande
 * claire plutôt qu'en blanc.
 */

// ── Jetons de couleur ────────────────────────────────────────────────────────
const FOND = '#0A0E1F'
const FOND_BARRE = '#0D1228'
const SURFACE = '#151A2E'
const SURFACE_HAUTE = '#1C2238'
const LISERE = 'rgba(255,255,255,0.07)'
const LISERE_FORT = 'rgba(255,255,255,0.14)'

const BLEU = '#3355FF'
const BLEU_CLAIR = '#A8B4FF'
const TEXTE = '#FFFFFF'
const TEXTE_SECONDAIRE = '#8A93B2'
const VERT = '#2ED3A0'
const CORAIL = '#FF6B6B'

export const COULEURS = {
  fond: FOND,
  fondBarre: FOND_BARRE,
  surface: SURFACE,
  surfaceHaute: SURFACE_HAUTE,
  lisere: LISERE,
  lisereFort: LISERE_FORT,
  bleu: BLEU,
  bleuClair: BLEU_CLAIR,
  vert: VERT,
  corail: CORAIL,
} as const

/**
 * Rayons d'arrondi, en pixels.
 *
 * ⚠️ Piège MUI : dans `sx`, une valeur NUMÉRIQUE de `borderRadius` est un multiplicateur
 * de `theme.shape.borderRadius`. On n'écrit donc jamais de nombre : toujours un jeton
 * `RAYONS.x` ou une chaîne en `px`.
 */
/**
 * Largeur maximale de l'application, en pixels.
 *
 * L'app est pensée pour le téléphone : sur un écran large elle reste dans cette
 * colonne centrée plutôt que de s'étirer. Une checklist de 1 400 px de large serait
 * illisible, et les maquettes ne vaudraient plus rien.
 */
export const LARGEUR_MOBILE = 460

export const RAYONS = {
  /** Cartes et surfaces principales. */
  carte: 16,
  /** Tuiles d'icône, champs de saisie, lignes de liste. */
  tuile: 12,
  /** Boutons — des rectangles adoucis, pas des pilules. */
  bouton: 12,
  /** Bottom sheets et boîtes de dialogue. */
  feuille: 22,
  /**
   * Petites puces de nature et d'état : rectangle adouci, pas pilule. Les bords
   * verticaux gardent une arête droite, ce qui les distingue des puces d'en-tête.
   */
  puce: 7,
  /** Jauges, puces d'en-tête, éléments franchement circulaires. */
  pilule: 999,
} as const

// ── Extensions de types ──────────────────────────────────────────────────────
declare module '@mui/material/styles' {
  interface Palette {
    lisere: string
    surfaceHaute: string
    bleuClair: string
  }
  interface PaletteOptions {
    lisere?: string
    surfaceHaute?: string
    bleuClair?: string
  }
  interface TypographyVariants {
    montantHero: React.CSSProperties
    montantCarte: React.CSSProperties
    libelle: React.CSSProperties
    titreSection: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    montantHero?: React.CSSProperties
    montantCarte?: React.CSSProperties
    libelle?: React.CSSProperties
    titreSection?: React.CSSProperties
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    montantHero: true
    montantCarte: true
    libelle: true
    titreSection: true
  }
}

/**
 * Chiffres à chasse fixe : sans ça, une colonne de montants « danse » d'une ligne à
 * l'autre, le `1` étant plus étroit que le `0`.
 */
const CHIFFRES_TABULAIRES = {
  fontVariantNumeric: 'tabular-nums' as const,
  fontFeatureSettings: '"tnum"',
}

const POLICE = [
  '"Inter"',
  '"SF Pro Display"',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI Variable Display"',
  '"Segoe UI"',
  'Roboto',
  'sans-serif',
].join(', ')

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: FOND, paper: SURFACE },
    primary: { main: BLEU, contrastText: TEXTE },
    secondary: { main: BLEU_CLAIR },
    success: { main: VERT },
    error: { main: CORAIL },
    text: { primary: TEXTE, secondary: TEXTE_SECONDAIRE },
    divider: LISERE,
    lisere: LISERE,
    surfaceHaute: SURFACE_HAUTE,
    bleuClair: BLEU_CLAIR,
  },

  // Base petite : elle multiplie les valeurs numériques de `sx`. Les composants qui
  // comptent ont leur rayon fixé explicitement plus bas.
  shape: { borderRadius: 4 },

  typography: {
    fontFamily: POLICE,
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    body2: { color: TEXTE_SECONDAIRE },
    button: { textTransform: 'none', fontWeight: 600 },

    /** Titre de section : « Mes comptes », « Charges imminentes ». */
    titreSection: {
      fontSize: '1.375rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: TEXTE,
    },
    /** Le chiffre roi d'un écran. En lavande : c'est la signature visuelle. */
    montantHero: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
      color: BLEU_CLAIR,
      ...CHIFFRES_TABULAIRES,
    },
    /** Montant d'une carte de compte ou d'un en-tête de bloc. */
    montantCarte: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      ...CHIFFRES_TABULAIRES,
    },
    /** Petite étiquette majuscule espacée, au-dessus d'un chiffre ou d'un groupe. */
    libelle: {
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: TEXTE_SECONDAIRE,
    },
  },

  components: {
    // Pas d'ondulation : c'est la signature Material la plus reconnaissable.
    MuiButtonBase: { defaultProps: { disableRipple: true } },

    // ⚠️ Sans cette table, MUI rend TOUTE variante personnalisée en <span>, donc en
    // ligne : l'étiquette et le montant se retrouvent collés sur la même ligne.
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          titreSection: 'h2',
          montantHero: 'p',
          montantCarte: 'p',
          libelle: 'p',
        },
      },
    },

    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: FOND,
          overscrollBehaviorY: 'none',
          WebkitTapHighlightColor: 'transparent',
        },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3 },
        'h1,h2,h3,h4,h5,h6': CHIFFRES_TABULAIRES,
      },
    },

    // Le liseré est ce qui détache les surfaces du fond marine : sans lui, tout se noie.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: SURFACE,
          borderRadius: RAYONS.carte,
          border: `1px solid ${LISERE}`,
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: SURFACE,
          borderRadius: RAYONS.carte,
          border: `1px solid ${LISERE}`,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RAYONS.bouton,
          paddingInline: 20,
          paddingBlock: 12,
          fontSize: '0.9375rem',
        },
        containedPrimary: {
          backgroundColor: BLEU,
          '&:hover': { backgroundColor: '#4463FF' },
        },
        outlined: {
          borderColor: LISERE_FORT,
          color: TEXTE,
          '&:hover': { borderColor: 'rgba(255,255,255,0.26)', backgroundColor: 'rgba(255,255,255,0.03)' },
        },
        text: { color: TEXTE_SECONDAIRE, paddingInline: 12 },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { color: TEXTE_SECONDAIRE, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: RAYONS.tuile,
          paddingBlock: 10,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
        },
      },
    },

    MuiListItemText: {
      styleOverrides: {
        primary: { fontWeight: 600 },
        secondary: { color: TEXTE_SECONDAIRE, fontSize: '0.8125rem' },
      },
    },

    // Cases carrées à coins légèrement adoucis, comme sur la référence.
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: LISERE_FORT,
          padding: 6,
          '& .MuiSvgIcon-root': { fontSize: 24, borderRadius: 6 },
          '&.Mui-checked': { color: BLEU },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 8, borderRadius: RAYONS.pilule, backgroundColor: 'rgba(255,255,255,0.08)' },
        bar: { borderRadius: RAYONS.pilule },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: RAYONS.pilule, fontWeight: 600, fontSize: '0.75rem', height: 28 },
        filled: { backgroundColor: 'rgba(255,255,255,0.07)', color: TEXTE_SECONDAIRE },
        outlined: { borderColor: LISERE_FORT },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: RAYONS.tuile,
          padding: 4,
          gap: 4,
        },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: `${RAYONS.tuile - 3}px !important`,
          textTransform: 'none',
          fontWeight: 600,
          color: TEXTE_SECONDAIRE,
          paddingBlock: 8,
          paddingInline: 16,
          '&.Mui-selected': {
            backgroundColor: SURFACE_HAUTE,
            color: TEXTE,
            '&:hover': { backgroundColor: SURFACE_HAUTE },
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RAYONS.tuile,
          backgroundColor: 'rgba(255,255,255,0.04)',
          '& fieldset': { borderColor: LISERE },
          '&:hover fieldset': { borderColor: LISERE_FORT },
          '&.Mui-focused fieldset': { borderColor: BLEU, borderWidth: 1 },
        },
      },
    },

    MuiInputLabel: { styleOverrides: { root: { color: TEXTE_SECONDAIRE } } },

    MuiDrawer: {
      styleOverrides: {
        paperAnchorBottom: {
          borderTopLeftRadius: RAYONS.feuille,
          borderTopRightRadius: RAYONS.feuille,
          borderBottom: 'none',
          backgroundColor: SURFACE,
          backgroundImage: 'none',
          paddingBottom: 'env(safe-area-inset-bottom)',
          // La feuille reste dans la colonne mobile même sur grand écran, sinon elle
          // s'étire sur toute la largeur alors que le contenu, lui, reste centré.
          maxWidth: LARGEUR_MOBILE,
          marginInline: 'auto',
          left: 0,
          right: 0,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: RAYONS.feuille, backgroundColor: SURFACE, backgroundImage: 'none' },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: { root: { backgroundColor: 'transparent', height: 64 } },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: TEXTE_SECONDAIRE, '&.Mui-selected': { color: BLEU_CLAIR } },
        label: {
          fontSize: '0.6875rem',
          '&.Mui-selected': { fontSize: '0.6875rem', fontWeight: 600 },
        },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: LISERE } } },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: RAYONS.tuile, border: `1px solid ${LISERE}` },
        standardError: { backgroundColor: alpha(CORAIL, 0.12), color: CORAIL },
        standardSuccess: { backgroundColor: alpha(VERT, 0.12), color: VERT },
      },
    },
  },
})
