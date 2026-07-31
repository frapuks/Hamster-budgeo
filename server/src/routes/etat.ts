import type { FastifyInstance } from 'fastify'
import type { EtatFoyer } from '@shared/types.js'
import { lireEtat } from '../db/etat.js'
import { foyerDeLaRequete } from '../contexte.js'

export async function routesEtat(app: FastifyInstance) {
  /**
   * L'unique lecture de l'application.
   *
   * Renvoie tout l'état du foyer, calculs inclus. Les mutations répondent avec ce même
   * objet, ce qui évite au front toute invalidation de cache.
   */
  app.get('/api/etat', async (req, reply): Promise<EtatFoyer | undefined> => {
    const etat = await lireEtat(foyerDeLaRequete(req))
    if (!etat) {
      reply.code(404).send({ erreur: 'Foyer introuvable.' })
      return
    }
    return etat
  })
}
