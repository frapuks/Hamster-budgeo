import type {
  EtatFoyer,
  ModeRepartition,
  RoleCompte,
  Sante,
  TypeCharge,
} from '@hamsterbudgeo/shared/types.js'

/**
 * Tous les appels HTTP passent par ce module. Les URL sont relatives : proxy Vite en
 * développement, même serveur en production — aucune question de CORS.
 */
/** Le code HTTP distingue « non connecté » (401), qui renvoie vers l'écran de
 *  connexion, d'une vraie panne, qui affiche une erreur. */
export class ErreurApi extends Error {
  constructor(
    readonly statut: number,
    message: string,
  ) {
    super(message)
  }
}

async function lireErreur(reponse: Response, chemin: string): Promise<never> {
  let message = `${chemin} a répondu ${reponse.status}`
  try {
    const corps = (await reponse.json()) as { erreur?: string }
    if (corps.erreur) message = corps.erreur
  } catch {
    // Réponse sans corps JSON : on garde le message par défaut.
  }
  throw new ErreurApi(reponse.status, message)
}

async function get<T>(chemin: string): Promise<T> {
  const reponse = await fetch(chemin)
  if (!reponse.ok) await lireErreur(reponse, chemin)
  return reponse.json() as Promise<T>
}

async function patch<T>(chemin: string, corps: unknown): Promise<T> {
  const reponse = await fetch(chemin, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  })
  if (!reponse.ok) await lireErreur(reponse, chemin)
  return reponse.json() as Promise<T>
}

export interface SaisieCharge {
  compteId: number
  categorieId: number | null
  nom: string
  type: TypeCharge
  /** Par mois si `mensuelle`, PAR AN si `annuelle`. */
  montantCents: number
  jourPrelevement: number | null
}

export interface SaisieBudget {
  compteId: number
  categorieId: number | null
  nom: string
  montantMensuelCents: number
}

export interface SaisieCompte {
  nom: string
  banque: string
  role: RoleCompte
  couleur: string
}

export interface SaisieCategorie {
  nom: string
  icone: string
  couleur: string
}

async function envoyer<T>(methode: 'POST' | 'DELETE', chemin: string, corps?: unknown): Promise<T> {
  // Corps JSON même vide sur un POST : sans `Content-Type`, Fastify refuse en 415.
  const avecCorps = methode === 'POST' || corps !== undefined
  const reponse = await fetch(chemin, {
    method: methode,
    ...(avecCorps
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps ?? {}) }
      : {}),
  })
  if (!reponse.ok) await lireErreur(reponse, chemin)
  return reponse.json() as Promise<T>
}

export interface NouvelleDepense {
  /** Vide : le serveur reprend le nom du budget. */
  libelle?: string
  montantCents: number
}

export const api = {
  getSante: () => get<Sante>('/api/health'),
  getEtat: () => get<EtatFoyer>('/api/etat'),

  /** Les mutations renvoient l'état complet : le cache est écrasé, jamais invalidé. */
  cocherCharge: (id: number, estPrelevee: boolean) =>
    patch<EtatFoyer>(`/api/charges/${id}/prelevee`, { estPrelevee }),

  ajouterDepense: (budgetId: number, depense: NouvelleDepense) =>
    envoyer<EtatFoyer>('POST', `/api/budgets/${budgetId}/depenses`, depense),

  supprimerDepense: (id: number) => envoyer<EtatFoyer>('DELETE', `/api/depenses/${id}`),

  creerCharge: (saisie: SaisieCharge) => envoyer<EtatFoyer>('POST', '/api/charges', saisie),
  modifierCharge: (id: number, saisie: SaisieCharge) =>
    patch<EtatFoyer>(`/api/charges/${id}`, saisie),
  supprimerCharge: (id: number) => envoyer<EtatFoyer>('DELETE', `/api/charges/${id}`),

  creerBudget: (saisie: SaisieBudget) => envoyer<EtatFoyer>('POST', '/api/budgets', saisie),
  modifierBudget: (id: number, saisie: SaisieBudget) =>
    patch<EtatFoyer>(`/api/budgets/${id}`, saisie),
  supprimerBudget: (id: number) => envoyer<EtatFoyer>('DELETE', `/api/budgets/${id}`),

  demarrerNouveauCycle: () => envoyer<EtatFoyer>('POST', '/api/cycle/reset'),

  modifierSalaire: (personneId: number, salaireNetCents: number) =>
    patch<EtatFoyer>(`/api/personnes/${personneId}/salaire`, { salaireNetCents }),
  definirModeRepartition: (mode: ModeRepartition) =>
    patch<EtatFoyer>('/api/foyer/repartition', { mode }),

  creerCompte: (saisie: SaisieCompte) => envoyer<EtatFoyer>('POST', '/api/comptes', saisie),
  modifierCompte: (id: number, saisie: SaisieCompte) =>
    patch<EtatFoyer>(`/api/comptes/${id}`, saisie),
  supprimerCompte: (id: number) => envoyer<EtatFoyer>('DELETE', `/api/comptes/${id}`),
  reordonnerComptes: (ids: number[]) => envoyer<EtatFoyer>('POST', '/api/comptes/ordre', { ids }),

  creerCategorie: (saisie: SaisieCategorie) =>
    envoyer<EtatFoyer>('POST', '/api/categories', saisie),
  supprimerCategorie: (id: number) => envoyer<EtatFoyer>('DELETE', `/api/categories/${id}`),

  chargerDemo: () => envoyer<EtatFoyer>('POST', '/api/donnees/demo'),
  toutEffacer: () => envoyer<EtatFoyer>('POST', '/api/donnees/effacer'),

  moi: () => get<{ email: string; personneId: number | null }>('/api/auth/moi'),
  inscription: (saisie: {
    email: string
    motDePasse: string
    prenom: string
    prenomConjoint: string
  }) => envoyer<EtatFoyer>('POST', '/api/auth/inscription', saisie),
  connexion: (email: string, motDePasse: string) =>
    envoyer<EtatFoyer>('POST', '/api/auth/connexion', { email, motDePasse }),
  deconnexion: () => envoyer<{ ok: boolean }>('POST', '/api/auth/deconnexion'),
  rejoindre: (code: string, email: string, motDePasse: string) =>
    envoyer<EtatFoyer>('POST', '/api/auth/rejoindre', { code, email, motDePasse }),
  creerInvitation: () => envoyer<{ code: string; prenom: string }>('POST', '/api/invitations'),
}
