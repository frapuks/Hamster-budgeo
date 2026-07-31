import type { FastifyInstance, FastifyReply } from 'fastify'
import {
  creerInvitation,
  fermerSession,
  inscrire,
  ouvrirSession,
  rejoindreAvecCode,
  verifierIdentifiants,
} from '../db/auth.js'
import { lireEtat } from '../db/etat.js'
import { foyerDeLaRequete, NOM_COOKIE } from '../contexte.js'

const MOT_DE_PASSE = { type: 'string', minLength: 8, maxLength: 200 } as const
const EMAIL = { type: 'string', format: 'email', maxLength: 200 } as const

const schemaInscription = {
  body: {
    type: 'object',
    required: ['email', 'motDePasse', 'prenom', 'prenomConjoint'],
    properties: {
      email: EMAIL,
      motDePasse: MOT_DE_PASSE,
      prenom: { type: 'string', minLength: 1, maxLength: 40 },
      prenomConjoint: { type: 'string', minLength: 1, maxLength: 40 },
    },
    additionalProperties: false,
  },
} as const

const schemaConnexion = {
  body: {
    type: 'object',
    required: ['email', 'motDePasse'],
    properties: { email: EMAIL, motDePasse: { type: 'string', maxLength: 200 } },
    additionalProperties: false,
  },
} as const

const schemaRejoindre = {
  body: {
    type: 'object',
    required: ['code', 'email', 'motDePasse'],
    properties: {
      code: { type: 'string', minLength: 4, maxLength: 12 },
      email: EMAIL,
      motDePasse: MOT_DE_PASSE,
    },
    additionalProperties: false,
  },
} as const

/**
 * Pose le cookie de session.
 *
 * `httpOnly` : inaccessible au JavaScript de la page, donc inexploitable par une
 * injection de script. `sameSite: lax` : non transmis depuis un autre site, ce qui
 * bloque les requêtes forgées. `secure` seulement si l'application est servie en HTTPS —
 * sur un réseau domestique en HTTP, l'imposer empêcherait toute connexion.
 */
function poserCookie(reply: FastifyReply, jeton: string) {
  reply.setCookie(NOM_COOKIE, jeton, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.HTTPS === 'true',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  })
}

export async function routesAuth(app: FastifyInstance) {
  app.get('/api/auth/moi', async (req, reply) => {
    if (!req.identite) return reply.code(401).send({ erreur: 'Non connecté.' })
    const { email, personneId } = req.identite
    return { email, personneId }
  })

  app.post<{ Body: { email: string; motDePasse: string; prenom: string; prenomConjoint: string } }>(
    '/api/auth/inscription',
    { schema: schemaInscription },
    async (req, reply) => {
      const resultat = await inscrire(req.body)
      if (resultat === 'email_pris') {
        return reply.code(409).send({ erreur: 'Cette adresse est déjà utilisée.' })
      }
      poserCookie(reply, await ouvrirSession(resultat.utilisateurId))
      return reply.code(201).send(await lireEtat(resultat.foyerId))
    },
  )

  app.post<{ Body: { email: string; motDePasse: string } }>(
    '/api/auth/connexion',
    { schema: schemaConnexion },
    async (req, reply) => {
      const identite = await verifierIdentifiants(req.body.email, req.body.motDePasse)
      // Message unique : distinguer « e-mail inconnu » de « mot de passe faux »
      // révélerait quelles adresses sont enregistrées.
      if (!identite) {
        return reply.code(401).send({ erreur: 'Adresse ou mot de passe incorrect.' })
      }
      poserCookie(reply, await ouvrirSession(identite.utilisateurId))
      return lireEtat(identite.foyerId)
    },
  )

  app.post('/api/auth/deconnexion', { schema: { body: { type: 'object', additionalProperties: false } } }, async (req, reply) => {
    const jeton = req.cookies[NOM_COOKIE]
    if (jeton) await fermerSession(jeton)
    reply.clearCookie(NOM_COOKIE, { path: '/' })
    return { ok: true }
  })

  app.post<{ Body: { code: string; email: string; motDePasse: string } }>(
    '/api/auth/rejoindre',
    { schema: schemaRejoindre },
    async (req, reply) => {
      const resultat = await rejoindreAvecCode(req.body.code, req.body.email, req.body.motDePasse)
      if (resultat === 'code_invalide') {
        return reply.code(404).send({ erreur: 'Code d’invitation inconnu ou expiré.' })
      }
      if (resultat === 'email_pris') {
        return reply.code(409).send({ erreur: 'Cette adresse est déjà utilisée.' })
      }
      poserCookie(reply, await ouvrirSession(resultat.utilisateurId))
      return reply.code(201).send(await lireEtat(resultat.foyerId))
    },
  )

  app.post('/api/invitations', { schema: { body: { type: 'object', additionalProperties: false } } }, async (req, reply) => {
    const invitation = await creerInvitation(foyerDeLaRequete(req))
    if (!invitation) {
      return reply.code(409).send({ erreur: 'Tout le monde a déjà un compte dans ce foyer.' })
    }
    return invitation
  })
}
