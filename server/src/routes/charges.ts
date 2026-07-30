import type { FastifyInstance } from 'fastify'
import { cocherCharge } from '../db/charges.js'
import { foyerCourant, lireEtat } from '../db/etat.js'

/**
 * Validation par schéma JSON natif de Fastify : pas de dépendance supplémentaire, et
 * la requête est rejetée en 400 avant même d'atteindre le gestionnaire.
 */
const schemaCochage = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1 } },
  },
  body: {
    type: 'object',
    required: ['estPrelevee'],
    properties: { estPrelevee: { type: 'boolean' } },
    additionalProperties: false,
  },
} as const

export async function routesCharges(app: FastifyInstance) {
  /**
   * Coche ou décoche une charge.
   *
   * Répond avec l'état complet du foyer, comme toutes les mutations : le front écrase
   * son cache avec la réponse, sans avoir à invalider quoi que ce soit.
   */
  app.patch<{ Params: { id: number }; Body: { estPrelevee: boolean } }>(
    '/api/charges/:id/prelevee',
    { schema: schemaCochage },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) {
        return reply.code(404).send({ erreur: 'Aucun foyer en base.' })
      }

      const modifiee = await cocherCharge(foyerId, req.params.id, req.body.estPrelevee)
      if (!modifiee) {
        return reply.code(404).send({ erreur: 'Charge introuvable ou non cochable.' })
      }

      return lireEtat(foyerId)
    },
  )
}
