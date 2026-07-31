import type { FastifyInstance } from 'fastify'
import type { SaisieCategorie } from '../db/categories.js'
import { creerCategorie, supprimerCategorie } from '../db/categories.js'
import type { SaisieCompte } from '../db/comptes.js'
import {
  creerCompte,
  modifierCompte,
  reordonnerComptes,
  supprimerCompte,
} from '../db/comptes.js'
import { viderFoyer } from '../db/donnees.js'
import { foyerCourant, lireEtat } from '../db/etat.js'
import { semer } from '../seed.js'

const paramId = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

const corpsCompte = {
  type: 'object',
  required: ['nom', 'role'],
  properties: {
    nom: { type: 'string', minLength: 1, maxLength: 60 },
    banque: { type: 'string', maxLength: 60 },
    role: { type: 'string', enum: ['prelevements', 'courant', 'provisions'] },
    couleur: { type: 'string', maxLength: 20 },
  },
  additionalProperties: false,
} as const

const corpsCategorie = {
  type: 'object',
  required: ['nom', 'icone', 'couleur'],
  properties: {
    nom: { type: 'string', minLength: 1, maxLength: 40 },
    icone: { type: 'string', minLength: 1, maxLength: 30 },
    couleur: { type: 'string', minLength: 1, maxLength: 20 },
  },
  additionalProperties: false,
} as const

const corpsOrdre = {
  type: 'object',
  required: ['ids'],
  properties: { ids: { type: 'array', items: { type: 'integer', minimum: 1 } } },
  additionalProperties: false,
} as const

export async function routesReglages(app: FastifyInstance) {
  // ── Comptes ────────────────────────────────────────────────────────────────
  app.post<{ Body: SaisieCompte }>(
    '/api/comptes',
    { schema: { body: corpsCompte } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      await creerCompte(foyerId, {
        ...req.body,
        banque: req.body.banque ?? '',
        couleur: req.body.couleur ?? 'bleu',
      })
      return reply.code(201).send(await lireEtat(foyerId))
    },
  )

  app.patch<{ Params: { id: number }; Body: SaisieCompte }>(
    '/api/comptes/:id',
    { schema: { params: paramId, body: corpsCompte } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const ok = await modifierCompte(foyerId, req.params.id, {
        ...req.body,
        banque: req.body.banque ?? '',
        couleur: req.body.couleur ?? 'bleu',
      })
      if (!ok) return reply.code(404).send({ erreur: 'Compte introuvable.' })

      return lireEtat(foyerId)
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/comptes/:id',
    { schema: { params: paramId } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const ok = await supprimerCompte(foyerId, req.params.id)
      if (!ok) return reply.code(404).send({ erreur: 'Compte introuvable.' })

      return lireEtat(foyerId)
    },
  )

  app.post<{ Body: { ids: number[] } }>(
    '/api/comptes/ordre',
    { schema: { body: corpsOrdre } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      await reordonnerComptes(foyerId, req.body.ids)
      return lireEtat(foyerId)
    },
  )

  // ── Catégories ─────────────────────────────────────────────────────────────
  app.post<{ Body: SaisieCategorie }>(
    '/api/categories',
    { schema: { body: corpsCategorie } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      await creerCategorie(foyerId, req.body)
      return reply.code(201).send(await lireEtat(foyerId))
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/categories/:id',
    { schema: { params: paramId } },
    async (req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      const ok = await supprimerCategorie(foyerId, req.params.id)
      if (!ok) return reply.code(404).send({ erreur: 'Catégorie introuvable.' })

      return lireEtat(foyerId)
    },
  )

  // ── Données ────────────────────────────────────────────────────────────────
  app.post(
    '/api/donnees/demo',
    { schema: { body: { type: 'object', additionalProperties: false } } },
    async () => {
      // Le seed recrée le foyer de zéro : on relit ensuite le foyer courant, dont
      // l'identifiant a changé.
      await semer()
      const foyerId = await foyerCourant()
      return foyerId === null ? { erreur: 'Chargement impossible.' } : lireEtat(foyerId)
    },
  )

  app.post(
    '/api/donnees/effacer',
    { schema: { body: { type: 'object', additionalProperties: false } } },
    async (_req, reply) => {
      const foyerId = await foyerCourant()
      if (foyerId === null) return reply.code(404).send({ erreur: 'Aucun foyer en base.' })

      await viderFoyer(foyerId)
      return lireEtat(foyerId)
    },
  )
}
