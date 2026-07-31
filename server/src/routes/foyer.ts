import type { FastifyInstance } from 'fastify'
import type { ModeRepartition } from '@hamsterbudgeo/shared/types.js'
import { lireEtat } from '../db/etat.js'
import { foyerDeLaRequete } from '../contexte.js'
import { definirModeRepartition, modifierSalaire } from '../db/foyer.js'

const schemaSalaire = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1 } },
  },
  body: {
    type: 'object',
    required: ['salaireNetCents'],
    // Entier, et zéro autorisé : un conjoint sans revenu déclaré est un cas normal,
    // que le mode « prorata » sait traiter.
    properties: { salaireNetCents: { type: 'integer', minimum: 0 } },
    additionalProperties: false,
  },
} as const

const schemaMode = {
  body: {
    type: 'object',
    required: ['mode'],
    properties: {
      mode: { type: 'string', enum: ['moitie', 'prorata_revenus', 'reste_a_vivre_egal'] },
    },
    additionalProperties: false,
  },
} as const

export async function routesFoyer(app: FastifyInstance) {
  app.patch<{ Params: { id: number }; Body: { salaireNetCents: number } }>(
    '/api/personnes/:id/salaire',
    { schema: schemaSalaire },
    async (req, reply) => {
      const foyerId = foyerDeLaRequete(req)

      const ok = await modifierSalaire(foyerId, req.params.id, req.body.salaireNetCents)
      if (!ok) return reply.code(404).send({ erreur: 'Personne introuvable.' })

      return lireEtat(foyerId)
    },
  )

  app.patch<{ Body: { mode: ModeRepartition } }>(
    '/api/foyer/repartition',
    { schema: schemaMode },
    async (req, reply) => {
      const foyerId = foyerDeLaRequete(req)

      await definirModeRepartition(foyerId, req.body.mode)
      return lireEtat(foyerId)
    },
  )
}
