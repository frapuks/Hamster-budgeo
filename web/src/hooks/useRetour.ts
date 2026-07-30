import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Retour à l'écran précédent.
 *
 * Un même écran est atteignable par plusieurs chemins : le détail d'un budget s'ouvre
 * depuis l'onglet Budgets, mais aussi depuis l'onglet Budgets d'un compte. Une
 * destination écrite en dur renverrait au mauvais endroit dans un cas sur deux.
 *
 * `location.key` vaut `'default'` uniquement sur la toute première entrée de la session
 * de navigation — page ouverte directement par son URL, ou rechargée. Dans ce cas il
 * n'y a rien derrière dans l'historique : `navigate(-1)` sortirait de l'application,
 * d'où le repli vers une destination sûre.
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
