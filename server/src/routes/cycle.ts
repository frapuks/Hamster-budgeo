import type { FastifyInstance } from 'fastify'
import { demarrerNouveauCycle } from '../db/cycle.js'
import { foyerCourant, lireEtat } from '../db/etat.js'

export async function routesCycle(app: FastifyInstance) {
  /**
   * Démarre un nouveau cycle. Irréversible : l'application ne garde aucun historique,
   * donc rien de ce qui est effacé ici n'est récupérable. La confirmation est du
   * ressort de l'interface, qui détaille ce qui va disparaître avant d'appeler.
   */
  app.post('/api/cycle/reset', {
    // La route ne prend aucun paramètre : le corps doit être un objet vide, et tout
    // champ envoyé par erreur est rejeté plutôt qu'ignoré silencieusement.
    schema: { body: { type: 'object', additionalProperties: false } },
  }, async (_req, reply) => {
    const foyerId = await foyerCourant()
    if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

    await demarrerNouveauCycle(foyerId)
    return lireEtat(foyerId)
  })
}
