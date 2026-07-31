import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Retour à l'écran précédent, un même écran étant atteignable par plusieurs chemins.
 *
 * `location.key === 'default'` signale la première entrée de la session — URL ouverte
 * directement ou page rechargée : l'historique est vide et `navigate(-1)` sortirait de
 * l'application, d'où le repli.
 */
export function useRetour(secours: string) {
  const navigate = useNavigate()
  const location = useLocation()

  return () => {
    if (location.key === 'default') {
      navigate(secours, { replace: true })
    } else {
      navigate(-1)
    }
  }
}
