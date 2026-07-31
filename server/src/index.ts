import { existsSync } from 'node:fs'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import statique from '@fastify/static'
import { brancherAuthentification } from './contexte.js'
import { attendreBase } from './db/client.js'
import { migrer } from './db/migrer.js'
import { routesAuth } from './routes/auth.js'
import { routesBudgets } from './routes/budgets.js'
import { routesCharges } from './routes/charges.js'
import { routesCycle } from './routes/cycle.js'
import { routesDebug } from './routes/debug.js'
import { routesDepenses } from './routes/depenses.js'
import { routesEtat } from './routes/etat.js'
import { routesFoyer } from './routes/foyer.js'
import { routesReglages } from './routes/reglages.js'
import { routesSante } from './routes/sante.js'

const port = Number(process.env.SERVER_PORT ?? 3001)
const production = process.env.NODE_ENV === 'production'

const app = Fastify({
  logger: production
    ? true
    : {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      },
})

/**
 * Migrations jouées au démarrage.
 *
 * En production, le conteneur peut être recréé à tout moment (mise à jour, redémarrage
 * du Pi) : appliquer les migrations ici évite une étape manuelle qu'on finirait par
 * oublier. Le runner ne rejoue que les fichiers absents de `schema_migrations`.
 */
if (production) {
  await attendreBase()
  const appliquees = await migrer()
  if (appliquees.length > 0) app.log.info(`Migrations appliquées : ${appliquees.join(', ')}`)
}

await app.register(cookie)
brancherAuthentification(app)

await app.register(routesAuth)
await app.register(routesSante)
await app.register(routesEtat)
await app.register(routesCharges)
await app.register(routesBudgets)
await app.register(routesDepenses)
await app.register(routesCycle)
await app.register(routesFoyer)
await app.register(routesReglages)
if (!production) await app.register(routesDebug)

/**
 * En production, le même serveur sert l'API et les fichiers du front.
 *
 * Un seul processus, un seul port, aucune question de CORS ni de reverse proxy à
 * configurer sur le Pi. Toute URL inconnue renvoie `index.html` : c'est ce qui permet
 * d'ouvrir directement `/budgets/2` ou de recharger la page dans une application à
 * navigation côté client.
 */
const DOSSIER_STATIQUE = process.env.STATIC_DIR
if (DOSSIER_STATIQUE && existsSync(DOSSIER_STATIQUE)) {
  await app.register(statique, { root: DOSSIER_STATIQUE })

  app.setNotFoundHandler((requete, reponse) => {
    if (requete.url.startsWith('/api/')) {
      return reponse.code(404).send({ erreur: 'Route inconnue.' })
    }
    return reponse.sendFile('index.html')
  })
}

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
