import type { FastifyInstance } from 'fastify'
import type { SaisieBudget } from '../db/budgets.js'
import { creerBudget, modifierBudget, supprimerBudget } from '../db/budgets.js'
import { lireEtat } from '../db/etat.js'
import { foyerDeLaRequete } from '../contexte.js'

const corpsBudget = {
  type: 'object',
  required: ['compteId', 'nom', 'montantMensuelCents'],
  properties: {
    compteId: { type: 'integer', minimum: 1 },
    categorieId: { type: ['integer', 'null'], minimum: 1 },
    nom: { type: 'string', minLength: 1, maxLength: 60 },
    // Entier : un budget est en centimes, jamais en euros décimaux.
    montantMensuelCents: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
} as const

const paramId = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export async function routesBudgets(app: FastifyInstance) {
  app.post<{ Body: SaisieBudget }>(
    '/api/budgets',
    { schema: { body: corpsBudget } },
    async (req, reply) => {
      const foyerId = foyerDeLaRequete(req)
      const creee = await creerBudget(foyerId, {
        ...req.body,
        categorieId: req.body.categorieId ?? null,
      })
      if (!creee) return reply.code(404).send({ erreur: 'Compte introuvable.' })

      return reply.code(201).send(await lireEtat(foyerId))
    },
  )

  app.patch<{ Params: { id: number }; Body: SaisieBudget }>(
    '/api/budgets/:id',
    { schema: { params: paramId, body: corpsBudget } },
    async (req, reply) => {
      const foyerId = foyerDeLaRequete(req)
      const ok = await modifierBudget(foyerId, req.params.id, {
        ...req.body,
        categorieId: req.body.categorieId ?? null,
      })
      if (!ok) return reply.code(404).send({ erreur: 'Budget introuvable.' })

      return lireEtat(foyerId)
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/budgets/:id',
    { schema: { params: paramId } },
    async (req, reply) => {
      const foyerId = foyerDeLaRequete(req)
      const ok = await supprimerBudget(foyerId, req.params.id)
      if (!ok) return reply.code(404).send({ erreur: 'Budget introuvable.' })

      return lireEtat(foyerId)
    },
  )
}
