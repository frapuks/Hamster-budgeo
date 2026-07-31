/**
 * Génère les icônes PNG de l'application.
 *
 * Écrit un PNG à la main (zlib de Node + CRC32) plutôt que d'ajouter une bibliothèque
 * de traitement d'images : celles-ci embarquent du code natif, ce qui compliquerait la
 * compilation sur Raspberry Pi pour un besoin qui se résume à quelques rectangles.
 *
 * Utilisation : `npm run icones --workspace web`
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const FOND = [0x33, 0x55, 0xff] // COULEURS.bleu
const GLYPHE = [0xff, 0xff, 0xff]

// ── Encodage PNG ─────────────────────────────────────────────────────────────

const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(donnees) {
  let c = 0xffffffff
  for (const octet of donnees) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, donnees) {
  const longueur = Buffer.alloc(4)
  longueur.writeUInt32BE(donnees.length)
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corps))
  return Buffer.concat([longueur, corps, crc])
}

/** `pixels` : Buffer RGBA de taille `cote * cote * 4`. */
function encoderPng(cote, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(cote, 0)
  ihdr.writeUInt32BE(cote, 4)
  ihdr[8] = 8 // profondeur
  ihdr[9] = 6 // RGBA
  // Chaque ligne est précédée d'un octet de filtre, ici 0 (aucun filtre).
  const brut = Buffer.alloc(cote * (cote * 4 + 1))
  for (let y = 0; y < cote; y++) {
    brut[y * (cote * 4 + 1)] = 0
    pixels.copy(brut, y * (cote * 4 + 1) + 1, y * cote * 4, (y + 1) * cote * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Dessin ───────────────────────────────────────────────────────────────────

/**
 * Fond plein et monogramme « H » centré.
 *
 * Le fond couvre tout le carré : c'est ce qu'exige le format « maskable », où le
 * système découpe lui-même la forme (cercle, carré arrondi…) selon la plateforme. Le
 * glyphe reste dans les 60 % centraux pour survivre au découpage le plus agressif.
 */
function dessiner(cote) {
  const pixels = Buffer.alloc(cote * cote * 4)
  const poser = (x, y, [r, v, b]) => {
    const i = (y * cote + x) * 4
    pixels[i] = r
    pixels[i + 1] = v
    pixels[i + 2] = b
    pixels[i + 3] = 255
  }

  for (let y = 0; y < cote; y++) for (let x = 0; x < cote; x++) poser(x, y, FOND)

  const hauteur = Math.round(cote * 0.4)
  const epaisseur = Math.round(cote * 0.09)
  const largeur = Math.round(cote * 0.32)
  const x0 = Math.round((cote - largeur) / 2)
  const y0 = Math.round((cote - hauteur) / 2)

  const rectangle = (x, y, l, h) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < l; dx++) poser(x + dx, y + dy, GLYPHE)
  }

  rectangle(x0, y0, epaisseur, hauteur) // barre gauche
  rectangle(x0 + largeur - epaisseur, y0, epaisseur, hauteur) // barre droite
  rectangle(x0, y0 + Math.round((hauteur - epaisseur) / 2), largeur, epaisseur) // barre centrale

  return pixels
}

// ── Sortie ───────────────────────────────────────────────────────────────────

const dossier = fileURLToPath(new URL('../public', import.meta.url))
mkdirSync(dossier, { recursive: true })

for (const cote of [192, 512]) {
  const chemin = join(dossier, `icone-${cote}.png`)
  writeFileSync(chemin, encoderPng(cote, dessiner(cote)))
  console.log(`Écrit : ${chemin}`)
}
