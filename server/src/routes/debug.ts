import type { FastifyInstance } from 'fastify'
import { dumperFoyer, foyerCourant } from '../db/dump.js'

/**
 * Routes de vérification manuelle. Non destinées à l'interface, et à retirer — ou à
 * protéger — avant la mise en production au lot 13.
 */
export async function routesDebug(app: FastifyInstance) {
  app.get('/api/debug/dump', async (_req, reply) => {
    const foyerId = await foyerCourant()
    if (foyerId === null) {
      return reply.code(404).send({ erreur: 'Aucun foyer en base. Lance `npm run seed`.' })
    }
    return dumperFoyer(foyerId)
  })
}
