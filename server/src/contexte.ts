import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { identiteDuJeton, type Identite } from './db/auth.js'

export const NOM_COOKIE = 'hamsterbudgeo_session'

declare module 'fastify' {
  interface FastifyRequest {
    /** Identité résolue depuis le cookie de session. `null` si non connecté. */
    identite: Identite | null
  }
}

/** Routes accessibles sans être connecté. */
const PUBLIQUES = ['/api/health', '/api/auth/']

/**
 * Résout la session à chaque requête et refuse l'accès aux routes protégées.
 *
 * C'est le seul endroit qui a changé au lot 11 : depuis le lot 1, toutes les fonctions
 * d'accès aux données prennent un `foyerId` en premier argument, fourni par ce point
 * unique. Il était codé en dur ; il vient maintenant de la session. Aucune requête SQL
 * n'a eu à être reprise.
 */
export function brancherAuthentification(app: FastifyInstance) {
  app.decorateRequest('identite', null)

  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const jeton = req.cookies[NOM_COOKIE]
    req.identite = jeton ? await identiteDuJeton(jeton) : null

    const publique = PUBLIQUES.some((prefixe) => req.url.startsWith(prefixe))
    if (!publique && req.url.startsWith('/api/') && req.identite === null) {
      return reply.code(401).send({ erreur: 'Non connecté.' })
    }
  })
}

/**
 * Foyer de la requête courante.
 *
 * Les routes protégées peuvent l'appeler sans vérification supplémentaire : le hook
 * ci-dessus a déjà répondu 401 si la session manquait.
 */
export function foyerDeLaRequete(req: FastifyRequest): number {
  if (!req.identite) throw new Error('foyerDeLaRequete appelé hors session')
  return req.identite.foyerId
}
