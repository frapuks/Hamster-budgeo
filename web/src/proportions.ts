/**
 * Convention d'affichage de l'application : **toutes les jauges montrent ce qui reste**,
 * jamais ce qui est consommé. Elles partent pleines et se vident.
 *
 * C'est l'inverse de l'usage le plus répandu, mais c'est le seul choix cohérent ici :
 * chaque écran met en avant un montant restant (reste à sortir, reste à dépenser). Une
 * jauge qui se remplirait pendant que le chiffre à côté d'elle diminue enverrait deux
 * signaux contraires.
 *
 * Le résultat est borné à [0, 100] : un dépassement vide la jauge, il ne la fait pas
 * repartir à l'envers.
 */
export function proportionRestante(resteCents: number, totalCents: number): number {
  if (totalCents <= 0) return 0
  return Math.max(0, Math.min(100, (resteCents / totalCents) * 100))
}
