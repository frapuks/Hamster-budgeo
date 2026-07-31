import type { FastifyInstance } from 'fastify'
import { demarrerNouveauCycle } from '../db/cycle.js'
import { lireEtat } from '../db/etat.js'
import { foyerDeLaRequete } from '../contexte.js'

export async function routesCycle(app: FastifyInstance) {
  /**
   * Démarre un nouveau cycle. Irréversible : l'application ne garde aucun historique,
   * donc rien de ce qui est effacé ici n'est récupérable. La confirmation est du
   * ressort de l'interface, qui détaille ce qui va disparaître avant d'appeler.
   */
  app.post(
    '/api/cycle/reset',
    { schema: { body: { type: 'object', additionalProperties: false } } },
    async (req) => {
      const foyerId = foyerDeLaRequete(req)
      await demarrerNouveauCycle(foyerId)
      return lireEtat(foyerId)
    },
  )
}
