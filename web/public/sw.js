/**
 * Service worker de HamsterBudgeo.
 *
 * Objectif volontairement modeste : rendre l'application installable et permettre son
 * ouverture instantanée, pas la faire fonctionner hors ligne. Les données affichées
 * sont des montants — un chiffre périmé serait pire qu'un message d'erreur.
 *
 * Trois règles :
 *   1. `/api/` n'est JAMAIS mis en cache. Ce sont des données personnelles derrière une
 *      session ; les servir depuis le cache afficherait des montants faux, et pourrait
 *      les laisser visibles après une déconnexion.
 *   2. Les fichiers versionnés (JS, CSS, images) sont servis depuis le cache et
 *      rafraîchis en arrière-plan. Leur nom contient une empreinte : un fichier donné ne
 *      change jamais de contenu.
 *   3. La navigation passe par le réseau, avec repli sur la coquille en cache. C'est ce
 *      qui donne un écran plutôt qu'une page d'erreur quand le Pi est éteint.
 */
const CACHE = 'hamsterbudgeo-v1'
const COQUILLE = '/index.html'

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([COQUILLE])),
  )
  // Une version installée prend la main immédiatement : sans cela, un correctif
  // n'apparaîtrait qu'après la fermeture de tous les onglets.
  self.skipWaiting()
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const url = new URL(requete.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return // règle 1

  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone()
          caches.open(CACHE).then((cache) => cache.put(COQUILLE, copie))
          return reponse
        })
        .catch(() => caches.match(COQUILLE).then((r) => r ?? Response.error())),
    )
    return
  }

  evenement.respondWith(
    caches.match(requete).then((enCache) => {
      const reseau = fetch(requete)
        .then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone()
            caches.open(CACHE).then((cache) => cache.put(requete, copie))
          }
          return reponse
        })
        .catch(() => enCache ?? Response.error())
      return enCache ?? reseau
    }),
  )
})
