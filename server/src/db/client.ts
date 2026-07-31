import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL manquant — copie .env.example en .env')
}

/** Aucune requête SQL en dehors de `server/src/db/` : les routes appellent des fonctions nommées. */
export const sql = postgres(url, {
  // snake_case en base, aliasé explicitement dans chaque SELECT : le SQL écrit reste
  // le SQL exécuté.
  transform: undefined,
  onnotice: () => {},
})

/** Utilisé par /api/health. */
export async function baseRepond(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch {
    return false
  }
}
