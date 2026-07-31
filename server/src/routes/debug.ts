import type { FastifyInstance } from 'fastify'
import { dumperFoyer } from '../db/dump.js'
import { foyerDeLaRequete } from '../contexte.js'

/**
 * Routes de vérification manuelle. Non destinées à l'interface, et à retirer — ou à
 * protéger — avant la mise en production au lot 13.
 */
export async function routesDebug(app: FastifyInstance) {
  app.get('/api/debug/dump', async (req) => dumperFoyer(foyerDeLaRequete(req)))
}
