import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL manquant — copie .env.example en .env')
}

/**
 * Client PostgreSQL unique de l'application.
 *
 * Convention du projet : aucune requête SQL en dehors de `server/src/db/`. Les routes
 * appellent des fonctions nommées de ce dossier, jamais `sql` directement.
 */
export const sql = postgres(url, {
  // Les colonnes sont en snake_case en base ; on aliase explicitement dans chaque SELECT
  // (`montant_cents AS "montantCents"`) plutôt que de transformer automatiquement, pour
  // que le SQL écrit reste exactement le SQL exécuté.
  transform: undefined,
  onnotice: () => {},
})

/** Vérifie que la base répond. Utilisé par /api/health. */
export async function baseRepond(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch {
    return false
  }
}
