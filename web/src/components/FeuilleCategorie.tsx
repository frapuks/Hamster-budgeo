import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Drawer, Stack, TextField, Typography } from '@mui/material'
import type { EtatFoyer } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { iconeDe, NOMS_ICONES } from '../icones.js'
import { COULEURS, RAYONS } from '../theme.js'
import { PoigneeFeuille } from './PoigneeFeuille.js'
import { COULEURS_CATEGORIE, TuileCategorie, type CouleurCategorie } from './TuileCategorie.js'

const COULEURS_DISPONIBLES = Object.keys(COULEURS_CATEGORIE) as CouleurCategorie[]

/** Encadré de sélection, commun à l'icône et à la couleur. */
function Choix({
  actif,
  onClick,
  children,
}: {
  actif: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: `${RAYONS.tuile}px`,
        outline: actif ? `2px solid ${COULEURS.bleuClair}` : 'none',
        outlineOffset: 2,
      }}
    >
      {children}
    </Box>
  )
}

export function FeuilleCategorie({
  ouverte,
  onFermer,
  onCree,
}: {
  ouverte: boolean
  onFermer: () => void
  /** Reçoit la catégorie créée, pour la sélectionner aussitôt dans un formulaire. */
  onCree?: (categorieId: number) => void
}) {
  const queryClient = useQueryClient()
  const [nom, setNom] = useState('')
  const [icone, setIcone] = useState(NOMS_ICONES[0]!)
  const [couleur, setCouleur] = useState<CouleurCategorie>('bleu')

  useEffect(() => {
    if (!ouverte) return
    setNom('')
    setIcone(NOMS_ICONES[0]!)
    setCouleur('bleu')
  }, [ouverte])

  const creer = useMutation({
    mutationFn: api.creerCategorie,
    onSuccess: (etat: EtatFoyer) => {
      // La réponse ne dit pas laquelle vient d'être créée : c'est celle qui n'était pas
      // encore dans le cache.
      const precedent = queryClient.getQueryData<EtatFoyer>(CLE_ETAT)
      const avant = new Set(precedent?.categories.map((c) => c.id) ?? [])
      const nouvelle = etat.categories.find((c) => !avant.has(c.id))

      queryClient.setQueryData(CLE_ETAT, etat)
      if (nouvelle) onCree?.(nouvelle.id)
      onFermer()
    },
  })

  const valide = nom.trim().length > 0

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3 }}>
        <PoigneeFeuille onFermer={onFermer} />

        {/* Aperçu : l'icône et la couleur choisies, telles qu'elles apparaîtront. */}
        <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center">
          <TuileCategorie Icone={iconeDe(icone)} couleur={couleur} taille={44} />
          <Typography variant="libelle">{nom.trim() || 'Nouvelle catégorie'}</Typography>
        </Stack>

        <TextField
          label="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 40 } }}
        />

        <Box>
          <Typography variant="libelle" sx={{ mb: 1 }}>
            Icône
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {NOMS_ICONES.map((nomIcone) => (
              <Choix key={nomIcone} actif={nomIcone === icone} onClick={() => setIcone(nomIcone)}>
                <TuileCategorie Icone={iconeDe(nomIcone)} couleur={couleur} taille={40} />
              </Choix>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="libelle" sx={{ mb: 1 }}>
            Couleur
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {COULEURS_DISPONIBLES.map((c) => (
              <Choix key={c} actif={c === couleur} onClick={() => setCouleur(c)}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: `${RAYONS.tuile}px`,
                    backgroundColor: COULEURS_CATEGORIE[c],
                  }}
                />
              </Choix>
            ))}
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          disabled={!valide || creer.isPending}
          onClick={() => creer.mutate({ nom: nom.trim(), icone, couleur })}
        >
          {creer.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </Stack>
    </Drawer>
  )
}
