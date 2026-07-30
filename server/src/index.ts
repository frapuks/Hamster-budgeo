import Fastify from 'fastify'
import { routesDebug } from './routes/debug.js'
import { routesSante } from './routes/sante.js'

const port = Number(process.env.SERVER_PORT ?? 3001)

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
  },
})

await app.register(routesSante)
await app.register(routesDebug)

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
