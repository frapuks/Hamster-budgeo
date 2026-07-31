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

/**
 * Attend que la base accepte les requêtes avant de laisser le serveur écouter.
 *
 * PostgreSQL accepte les connexions TCP avant d'avoir fini de démarrer et répond alors
 * « the database system is starting up » : sans cette attente, toute requête reçue
 * pendant ce laps de temps échoue en 500. C'est particulièrement visible au premier
 * lancement sur une carte SD.
 */
export async function attendreBase(secondes = 60): Promise<void> {
  const limite = Date.now() + secondes * 1000
  let derniere: unknown

  while (Date.now() < limite) {
    try {
      await sql`SELECT 1`
      return
    } catch (erreur) {
      derniere = erreur
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  throw new Error(`Base injoignable après ${secondes} s : ${String(derniere)}`)
}
