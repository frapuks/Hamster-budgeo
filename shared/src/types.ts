/**
 * Types de domaine, écrits à la main.
 *
 * Sans ORM, rien ne garantit automatiquement que ces types correspondent aux requêtes
 * SQL : ils font foi, et les fonctions de `server/src/db/` doivent s'y conformer.
 *
 * Ce fichier se remplira au lot 1 (schéma) et au lot 2 (état calculé).
 */

export type RoleCompte = 'prelevements' | 'courant' | 'provisions'
export type TypeCharge = 'mensuelle' | 'annuelle'

/** Réponse de GET /api/health. */
export interface Sante {
  ok: boolean
  base: 'connectee' | 'injoignable'
  version: string
}
