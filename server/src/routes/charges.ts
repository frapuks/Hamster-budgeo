import type { FastifyInstance } from 'fastify'
import type { SaisieCharge } from '../db/charges.js'
import { cocherCharge, creerCharge, modifierCharge, supprimerCharge } from '../db/charges.js'
import { foyerCourant, lireEtat } from '../db/etat.js'

/** Corps commun à la création et à la modification. */
const corpsCharge = {
  type: 'object',
  required: ['compteId', 'nom', 'type', 'montantCents'],
  properties: {
    compteId: { type: 'integer', minimum: 1 },
    categorieId: { type: ['integer', 'null'], minimum: 1 },
    nom: { type: 'string', minLength: 1, maxLength: 80 },
    type: { type: 'string', enum: ['mensuelle', 'annuelle'] },
    // Entier : les montants sont en centimes, jamais en euros décimaux.
    montantCents: { type: 'integer', minimum: 1 },
    jourPrelevement: { type: ['integer', 'null'], minimum: 1, maximum: 31 },
  },
  additionalProperties: false,
} as const

const paramId = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

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

  app.post<{ Body: SaisieCharge }>(
    '/api/charges',
    { schema: { body: corpsCharge } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const creee = await creerCharge(foyerId, {
        ...req.body,
        categorieId: req.body.categorieId ?? null,
        jourPrelevement: req.body.jourPrelevement ?? null,
      })
      if (!creee) return reply.code(404).send({ erreur: 'Compte introuvable.' })

      return reply.code(201).send(await lireEtat(foyerId))
    },
  )

  app.patch<{ Params: { id: number }; Body: SaisieCharge }>(
    '/api/charges/:id',
    { schema: { params: paramId, body: corpsCharge } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const modifiee = await modifierCharge(foyerId, req.params.id, {
        ...req.body,
        categorieId: req.body.categorieId ?? null,
        jourPrelevement: req.body.jourPrelevement ?? null,
      })
      if (!modifiee) return reply.code(404).send({ erreur: 'Charge introuvable.' })

      return lireEtat(foyerId)
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/charges/:id',
    { schema: { params: paramId } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const supprimee = await supprimerCharge(foyerId, req.params.id)
      if (!supprimee) return reply.code(404).send({ erreur: 'Charge introuvable.' })

      return lireEtat(foyerId)
    },
  )
}
