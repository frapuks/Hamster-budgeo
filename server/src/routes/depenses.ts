import type { FastifyInstance } from 'fastify'
import { ajouterDepense, supprimerDepense } from '../db/depenses.js'
import { foyerCourant, lireEtat } from '../db/etat.js'

const schemaAjout = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1 } },
  },
  body: {
    type: 'object',
    // `libelle` est facultatif : vide, il prend le nom du budget (voir db/depenses.ts).
    required: ['montantCents'],
    properties: {
      libelle: { type: 'string', maxLength: 80 },
      // Entier : une dépense est en centimes, jamais en euros décimaux.
      montantCents: { type: 'integer', minimum: 1 },
      dateDepense: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      personneId: { type: ['integer', 'null'], minimum: 1 },
    },
    additionalProperties: false,
  },
} as const

const schemaSuppression = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1 } },
  },
} as const

/** Date du jour au format `YYYY-MM-DD`, en heure locale du serveur. */
function aujourdHui(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function routesDepenses(app: FastifyInstance) {
  app.post<{
    Params: { id: number }
    Body: { libelle?: string; montantCents: number; dateDepense?: string; personneId?: number | null }
  }>('/api/budgets/:id/depenses', { schema: schemaAjout }, async (req, reply) => {
    const foyerId = await foyerCourant()
    if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

    const ajoutee = await ajouterDepense(foyerId, req.params.id, {
      libelle: req.body.libelle ?? '',
      montantCents: req.body.montantCents,
      dateDepense: req.body.dateDepense ?? aujourdHui(),
      personneId: req.body.personneId ?? null,
    })
    if (!ajoutee) return reply.code(404).send({ erreur: 'Budget introuvable.' })

    return lireEtat(foyerId)
  })

  app.delete<{ Params: { id: number } }>(
    '/api/depenses/:id',
    { schema: schemaSuppression },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const supprimee = await supprimerDepense(foyerId, req.params.id)
      if (!supprimee) return reply.code(404).send({ erreur: 'Dépense introuvable.' })

      return lireEtat(foyerId)
    },
  )
}
