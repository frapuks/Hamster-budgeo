import Fastify from 'fastify'
import { routesCharges } from './routes/charges.js'
import { routesCycle } from './routes/cycle.js'
import { routesDebug } from './routes/debug.js'
import { routesDepenses } from './routes/depenses.js'
import { routesEtat } from './routes/etat.js'
import { routesFoyer } from './routes/foyer.js'
import { routesReglages } from './routes/reglages.js'
import { routesSante } from './routes/sante.js'

const port = Number(process.env.SERVER_PORT ?? 3001)

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
  },
})

await app.register(routesSante)
await app.register(routesEtat)
await app.register(routesCharges)
await app.register(routesDepenses)
await app.register(routesCycle)
await app.register(routesFoyer)
await app.register(routesReglages)
await app.register(routesDebug)

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
