import type { FastifyInstance } from 'fastify'
import { demarrerNouveauCycle } from '../db/cycle.js'
import { lireEtat } from '../db/etat.js'
import { historiqueBudget } from '../db/historique.js'
import { foyerDeLaRequete } from '../contexte.js'

const corpsReset = {
  type: 'object',
  properties: {
    /** Premier jour du mois de rattachement. Absent : la règle du milieu de cycle. */
    mois: { type: 'string', pattern: '^\\d{4}-\\d{2}-01$' },
  },
  additionalProperties: false,
} as const

export async function routesCycle(app: FastifyInstance) {
  /**
   * Démarre un nouveau cycle. Le cycle qui s'achève est copié dans l'archive avant
   * l'effacement, dans la même transaction : c'est le seul instant où l'on sait encore
   * ce qu'il contenait. La confirmation est du ressort de l'interface, qui détaille ce
   * qui va disparaître avant d'appeler.
   */
  app.post<{ Body: { mois?: string } }>(
    '/api/cycle/reset',
    { schema: { body: corpsReset } },
    async (req) => {
      const foyerId = foyerDeLaRequete(req)
      await demarrerNouveauCycle(foyerId, req.body?.mois)
      return lireEtat(foyerId)
    },
  )

  /** Hors de `EtatFoyer` : lecture seule, jamais mutée, absente de tout calcul. */
  app.get<{ Params: { id: number } }>(
    '/api/budgets/:id/historique',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'integer', minimum: 1 } },
        },
      },
    },
    async (req) => {
      const foyerId = foyerDeLaRequete(req)
      return { budgetId: req.params.id, mois: await historiqueBudget(foyerId, req.params.id) }
    },
  )
}
