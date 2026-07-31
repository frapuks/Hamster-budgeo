import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { sql } from './client.js'

const DUREE_SESSION_JOURS = 60
const DUREE_INVITATION_JOURS = 7

/** Le jeton circule en clair dans le cookie mais n'est stocké qu'en empreinte : une
 *  lecture de la base ne permet pas d'usurper une session. */
const empreinte = (jeton: string) => createHash('sha256').update(jeton).digest('hex')

export interface Identite {
  utilisateurId: number
  foyerId: number
  personneId: number | null
  email: string
}


export interface Inscription {
  email: string
  motDePasse: string
  prenom: string
  prenomConjoint: string
}

/**
 * Crée un compte et son foyer.
 *
 * Si la base contient déjà un foyer sans aucun utilisateur, le nouvel utilisateur
 * l'adopte au lieu d'en créer un vide à côté — sinon les données saisies avant la mise
 * en place des comptes deviendraient inaccessibles.
 */
export async function inscrire(saisie: Inscription): Promise<Identite | 'email_pris'> {
  const [existant] = await sql`SELECT id FROM utilisateur WHERE email = ${saisie.email.toLowerCase()}`
  if (existant) return 'email_pris'

  const hash = await bcrypt.hash(saisie.motDePasse, 10)

  return sql.begin(async (tx) => {
    const [orphelin] = await tx<{ id: number }[]>`
      SELECT f.id FROM foyer f
      LEFT JOIN utilisateur u ON u.foyer_id = f.id
      WHERE u.id IS NULL
      ORDER BY f.id
      LIMIT 1
    `

    let foyerId: number
    let personneId: number

    if (orphelin) {
      foyerId = orphelin.id
      const [premiere] = await tx<{ id: number }[]>`
        SELECT id FROM personne WHERE foyer_id = ${foyerId} ORDER BY ordre, id LIMIT 1
      `
      if (premiere) {
        // Sans renommer : les prénoms déjà saisis font foi.
        personneId = premiere.id
      } else {
        const [creee] = await tx<{ id: number }[]>`
          INSERT INTO personne (foyer_id, prenom, ordre) VALUES (${foyerId}, ${saisie.prenom}, 0)
          RETURNING id
        `
        personneId = creee!.id
      }
    } else {
      const [foyer] = await tx<{ id: number }[]>`
        INSERT INTO foyer (nom) VALUES (${`Foyer de ${saisie.prenom}`}) RETURNING id
      `
      foyerId = foyer!.id
      const [moi] = await tx<{ id: number }[]>`
        INSERT INTO personne (foyer_id, prenom, couleur, ordre)
        VALUES (${foyerId}, ${saisie.prenom}, 'violet', 0)
        RETURNING id
      `
      personneId = moi!.id
      await tx`
        INSERT INTO personne (foyer_id, prenom, couleur, ordre)
        VALUES (${foyerId}, ${saisie.prenomConjoint}, 'turquoise', 1)
      `
    }

    const [utilisateur] = await tx<{ id: number }[]>`
      INSERT INTO utilisateur (foyer_id, personne_id, email, mot_de_passe)
      VALUES (${foyerId}, ${personneId}, ${saisie.email.toLowerCase()}, ${hash})
      RETURNING id
    `

    return {
      utilisateurId: utilisateur!.id,
      foyerId,
      personneId,
      email: saisie.email.toLowerCase(),
    }
  })
}


export async function verifierIdentifiants(
  email: string,
  motDePasse: string,
): Promise<Identite | null> {
  const [utilisateur] = await sql<
    { id: number; foyerId: number; personneId: number | null; email: string; motDePasse: string }[]
  >`
    SELECT id, foyer_id AS "foyerId", personne_id AS "personneId", email,
           mot_de_passe AS "motDePasse"
    FROM utilisateur WHERE email = ${email.toLowerCase()}
  `
  // Comparaison faite même si l'utilisateur n'existe pas : sinon le temps de réponse
  // révélerait quels e-mails sont enregistrés.
  const hash = utilisateur?.motDePasse ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi'
  const correct = await bcrypt.compare(motDePasse, hash)
  if (!utilisateur || !correct) return null

  return {
    utilisateurId: utilisateur.id,
    foyerId: utilisateur.foyerId,
    personneId: utilisateur.personneId,
    email: utilisateur.email,
  }
}


export async function ouvrirSession(utilisateurId: number): Promise<string> {
  const jeton = randomBytes(32).toString('hex')
  await sql`
    INSERT INTO session (utilisateur_id, jeton_hash, expire_le)
    VALUES (${utilisateurId}, ${empreinte(jeton)},
            now() + ${`${DUREE_SESSION_JOURS} days`}::interval)
  `
  return jeton
}

export async function identiteDuJeton(jeton: string): Promise<Identite | null> {
  const [ligne] = await sql<
    { utilisateurId: number; foyerId: number; personneId: number | null; email: string }[]
  >`
    SELECT u.id AS "utilisateurId", u.foyer_id AS "foyerId",
           u.personne_id AS "personneId", u.email
    FROM session s
    JOIN utilisateur u ON u.id = s.utilisateur_id
    WHERE s.jeton_hash = ${empreinte(jeton)} AND s.expire_le > now()
  `
  return ligne ?? null
}

export async function fermerSession(jeton: string): Promise<void> {
  await sql`DELETE FROM session WHERE jeton_hash = ${empreinte(jeton)}`
}


/**
 * Crée une invitation pour la personne du foyer qui n'a pas encore de compte.
 * Renvoie `null` si tout le monde est déjà rattaché.
 */
export async function creerInvitation(foyerId: number): Promise<{ code: string; prenom: string } | null> {
  const [libre] = await sql<{ id: number; prenom: string }[]>`
    SELECT p.id, p.prenom FROM personne p
    LEFT JOIN utilisateur u ON u.personne_id = p.id
    WHERE p.foyer_id = ${foyerId} AND u.id IS NULL
    ORDER BY p.ordre, p.id
    LIMIT 1
  `
  if (!libre) return null

  // Alphabet sans I, O, 0 ni 1 : le code se lit à voix haute ou se recopie à la main.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = Array.from(randomBytes(6))
    .map((o) => alphabet[o % alphabet.length])
    .join('')

  await sql`DELETE FROM invitation WHERE personne_id = ${libre.id}`
  await sql`
    INSERT INTO invitation (foyer_id, personne_id, code, expire_le)
    VALUES (${foyerId}, ${libre.id}, ${code}, now() + ${`${DUREE_INVITATION_JOURS} days`}::interval)
  `
  return { code, prenom: libre.prenom }
}

/**
 * Rattache un nouveau compte à la personne visée par l'invitation : le conjoint
 * récupère la personne existante avec son salaire, sans migration de données.
 */
export async function rejoindreAvecCode(
  code: string,
  email: string,
  motDePasse: string,
): Promise<Identite | 'code_invalide' | 'email_pris'> {
  const [invitation] = await sql<{ foyerId: number; personneId: number }[]>`
    SELECT foyer_id AS "foyerId", personne_id AS "personneId"
    FROM invitation WHERE code = ${code.toUpperCase()} AND expire_le > now()
  `
  if (!invitation) return 'code_invalide'

  const [existant] = await sql`SELECT id FROM utilisateur WHERE email = ${email.toLowerCase()}`
  if (existant) return 'email_pris'

  const hash = await bcrypt.hash(motDePasse, 10)

  return sql.begin(async (tx) => {
    const [utilisateur] = await tx<{ id: number }[]>`
      INSERT INTO utilisateur (foyer_id, personne_id, email, mot_de_passe)
      VALUES (${invitation.foyerId}, ${invitation.personneId}, ${email.toLowerCase()}, ${hash})
      RETURNING id
    `
    await tx`DELETE FROM invitation WHERE code = ${code.toUpperCase()}`

    return {
      utilisateurId: utilisateur!.id,
      foyerId: invitation.foyerId,
      personneId: invitation.personneId,
      email: email.toLowerCase(),
    }
  })
}
