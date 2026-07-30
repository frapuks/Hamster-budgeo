import type { FastifyInstance } from 'fastify'
import type { Sante } from '@shared/types.js'
import { baseRepond } from '../db/client.js'

export async function routesSante(app: FastifyInstance) {
  app.get('/api/health', async (): Promise<Sante> => {
    const connectee = await baseRepond()
    return {
      ok: connectee,
      base: connectee ? 'connectee' : 'injoignable',
      version: '0.1.0',
    }
  })
}
