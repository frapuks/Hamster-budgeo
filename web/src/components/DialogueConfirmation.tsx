import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

/**
 * Sans historique, rien de ce qui est supprimé n'est récupérable : d'où la confirmation,
 * et le bouton qui nomme ce qu'il détruit plutôt qu'un « OK » anonyme.
 */
export function DialogueConfirmation({
  ouvert,
  titre,
  message,
  libelleAction = 'Supprimer',
  onConfirmer,
  onAnnuler,
}: {
  ouvert: boolean
  titre: string
  message: string
  libelleAction?: string
  onConfirmer: () => void
  onAnnuler: () => void
}) {
  return (
    <Dialog open={ouvert} onClose={onAnnuler} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{titre}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1, flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={onConfirmer}
          sx={{ color: '#FFF' }}
        >
          {libelleAction}
        </Button>
        <Button variant="text" fullWidth onClick={onAnnuler}>
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  )
}
