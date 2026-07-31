import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { sql } from './client.js'

/**
 * Applique dans l'ordre alphabétique les fichiers `migrations/*.sql` non encore joués,
 * chacun dans sa propre transaction : la base ne reste jamais à moitié migrée.
 *
 * Le dossier est paramétrable parce que l'arborescence compilée diffère de celle des
 * sources — l'image Docker le fixe par variable d'environnement.
 */
const DOSSIER =
  process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('../../migrations', import.meta.url))

export async function migrer(): Promise<string[]> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nom        TEXT PRIMARY KEY,
      applique_le TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  const deja = new Set(
    (await sql<{ nom: string }[]>`SELECT nom FROM schema_migrations`).map((l) => l.nom),
  )

  const fichiers = (await readdir(DOSSIER)).filter((f) => f.endsWith('.sql')).sort()
  const appliquees: string[] = []

  for (const fichier of fichiers) {
    if (deja.has(fichier)) continue

    const contenu = await readFile(join(DOSSIER, fichier), 'utf8')
    await sql.begin(async (tx) => {
      await tx.unsafe(contenu)
      await tx`INSERT INTO schema_migrations (nom) VALUES (${fichier})`
    })
    appliquees.push(fichier)
  }

  return appliquees
}

// Exécution directe : `npm run migrate`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const appliquees = await migrer()
  console.log(
    appliquees.length === 0
      ? 'Base déjà à jour, aucune migration à appliquer.'
      : `Migrations appliquées : ${appliquees.join(', ')}`,
  )
  await sql.end()
}
