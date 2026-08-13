import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import type { Categorie } from '@hamsterbudgeo/shared/types.js'
import { couleurDe, iconeDe } from '../icones.js'
import { COULEURS, RAYONS } from '../theme.js'
import { FeuilleCategorie } from './FeuilleCategorie.js'
import { TuileCategorie } from './TuileCategorie.js'

/**
 * Grille de catégories, avec création à la volée.
 *
 * Partagée par les formulaires de charge et de budget : les deux posaient la même
 * question, et le bloc avait déjà commencé à diverger entre les deux écrans.
 *
 * Un second clic sur la catégorie active la désélectionne — une charge peut rester
 * sans classement.
 */
export function SelecteurCategorie({
  categories,
  valeur,
  onChange,
}: {
  categories: Categorie[]
  valeur: number | null
  onChange: (categorieId: number | null) => void
}) {
  const [feuilleOuverte, setFeuilleOuverte] = useState(false)

  return (
    <Box>
      <Typography variant="libelle" sx={{ mb: 1 }}>
        Catégorie
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {categories.map((categorie) => {
          const active = categorie.id === valeur
          return (
            <Box
              key={categorie.id}
              onClick={() => onChange(active ? null : categorie.id)}
              title={categorie.nom}
              sx={{
                cursor: 'pointer',
                borderRadius: `${RAYONS.tuile}px`,
                outline: active ? `2px solid ${COULEURS.bleuClair}` : 'none',
                outlineOffset: 2,
              }}
            >
              <TuileCategorie
                Icone={iconeDe(categorie.icone)}
                couleur={couleurDe(categorie.couleur)}
                taille={40}
              />
            </Box>
          )
        })}

        <Box
          onClick={() => setFeuilleOuverte(true)}
          aria-label="Nouvelle catégorie"
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

      <FeuilleCategorie
        ouverte={feuilleOuverte}
        onFermer={() => setFeuilleOuverte(false)}
        onCree={onChange}
      />
    </Box>
  )
}
