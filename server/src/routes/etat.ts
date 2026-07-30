import type { FastifyInstance } from 'fastify'
import type { EtatFoyer } from '@shared/types.js'
import { foyerCourant, lireEtat } from '../db/etat.js'

export async function routesEtat(app: FastifyInstance) {
  /**
   * L'unique lecture de l'application.
   *
   * Renvoie tout l'état du foyer, calculs inclus. Les mutations des lots suivants
   * répondront avec ce même objet, ce qui évite au front toute invalidation de cache.
   */
  app.get('/api/etat', async (_req, reply): Promise<EtatFoyer | undefined> => {
    const foyerId = await foyerCourant()
    if (foyerId === null) {
      reply.code(404).send({ erreur: 'Aucun foyer en base. Lance `npm run seed`.' })
      return
    }

    const etat = await lireEtat(foyerId)
    if (!etat) {
      reply.code(404).send({ erreur: 'Foyer introuvable.' })
      return
    }
    return etat
  })
}
