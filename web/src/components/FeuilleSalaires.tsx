import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Stack, TextField, Typography } from '@mui/material'
import { PoigneeFeuille } from './PoigneeFeuille.js'
import type { EtatFoyer, Personne } from '@hamsterbudgeo/shared/types.js'
import { api } from '../api/client.js'
import { CLE_ETAT } from '../hooks/useEtat.js'
import { TEINTES_PERSONNE } from '../theme.js'

/** Euros saisis → centimes. `null` si la saisie n'est pas un montant recevable. */
function enCents(saisie: string): number | null {
  const euros = Number(saisie.replace(',', '.'))
  return Number.isFinite(euros) && euros >= 0 ? Math.round(euros * 100) : null
}

export function FeuilleSalaires({
  ouverte,
  onFermer,
  personnes,
}: {
  ouverte: boolean
  onFermer: () => void
  personnes: Personne[]
}) {
  const queryClient = useQueryClient()
  const [saisies, setSaisies] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!ouverte) return
    setSaisies(
      Object.fromEntries(personnes.map((p) => [p.id, (p.salaireNetCents / 100).toFixed(2)])),
    )
  }, [ouverte, personnes])

  /**
   * L'API ne modifie qu'un salaire à la fois. Les envois s'enchaînent donc en série, et
   * c'est le dernier état renvoyé qui alimente le cache — un envoi parallèle ferait
   * gagner une réponse arrivée hors d'ordre, donc potentiellement périmée.
   */
  const enregistrement = useMutation({
    mutationFn: async (valeurs: { id: number; cents: number }[]) => {
      let etat: EtatFoyer | undefined
      for (const { id, cents } of valeurs) etat = await api.modifierSalaire(id, cents)
      return etat
    },
    onSuccess: (etat) => {
      if (etat) queryClient.setQueryData(CLE_ETAT, etat)
      onFermer()
    },
  })

  const valide = personnes.every((p) => enCents(saisies[p.id] ?? '') !== null)

  const enregistrer = () => {
    const modifies = personnes
      .map((p) => ({ id: p.id, cents: enCents(saisies[p.id] ?? '') ?? p.salaireNetCents }))
      .filter(({ id, cents }) => cents !== personnes.find((p) => p.id === id)!.salaireNetCents)

    if (modifies.length === 0) onFermer()
    else enregistrement.mutate(modifies)
  }

  return (
    <Drawer anchor="bottom" open={ouverte} onClose={onFermer}>
      <Stack spacing={2} sx={{ p: 2.5, pb: 3 }}>
        <PoigneeFeuille titre="Modifier les salaires" />

        {personnes.map((personne, i) => (
          <TextField
            key={personne.id}
            label={personne.prenom}
            value={saisies[personne.id] ?? ''}
            onChange={(e) =>
              setSaisies((s) => ({
                ...s,
                [personne.id]: e.target.value.replace(/[^0-9.,]/g, ''),
              }))
            }
            fullWidth
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { endAdornment: <Typography variant="body2">€</Typography> },
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderLeft: `3px solid ${TEINTES_PERSONNE[i % 2]}` } }}
          />
        ))}

        <Button
          variant="contained"
          fullWidth
          disabled={!valide || enregistrement.isPending}
          onClick={enregistrer}
        >
          {enregistrement.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </Stack>
    </Drawer>
  )
}
