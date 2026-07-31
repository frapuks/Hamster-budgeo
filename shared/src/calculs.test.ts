import { describe, expect, it } from 'vitest'
import {
  besoinDuCycle,
  coutMensuelLisse,
  dejaPreleve,
  provisionMensuelle,
  repartir,
  resteADepenser,
  resteASortir,
  totalAnnuel,
  totalDuCycle,
  virementPermanent,
} from './calculs.js'
import type { Budget, Charge, Personne } from './types.js'


let compteur = 0
function charge(p: Partial<Charge> = {}): Charge {
  return {
    id: ++compteur,
    compteId: 1,
    nom: 'Charge',
    type: 'mensuelle',
    montantCents: 1000,
    jourPrelevement: 1,
    estPrelevee: false,
    actif: true,
    categorie: null,
    ...p,
  }
}

function budget(montantCents: number, depenses: number[] = []): Budget {
  return {
    id: ++compteur,
    compteId: 1,
    nom: 'Budget',
    montantMensuelCents: montantCents,
    categorie: null,
    depenses: depenses.map((m) => ({
      id: ++compteur,
      budgetId: 1,
      personneId: null,
      libelle: 'Dépense',
      montantCents: m,
      dateDepense: '2025-07-05',
    })),
  }
}

const personne = (id: number, prenom: string, salaireNetCents: number): Personne => ({
  id,
  prenom,
  salaireNetCents,
  couleur: 'bleu',
})


describe('coutMensuelLisse — la parade au facteur 12', () => {
  it('laisse une charge mensuelle inchangée', () => {
    expect(coutMensuelLisse({ type: 'mensuelle', montantCents: 85000 })).toBe(85000)
  })

  it('divise une charge annuelle par douze', () => {
    // 600,00 € par an = 50,00 € par mois. Le test qui rattrape l'erreur si un jour
    // quelqu'un additionne montantCents directement.
    expect(coutMensuelLisse({ type: 'annuelle', montantCents: 60000 })).toBe(5000)
  })

  it('arrondit au centime pour un montant non divisible par douze', () => {
    // 250,00 €/an → 20,8333… €/mois → 20,83 €. L'écart de 4 centimes sur l'année est
    // assumé : le corriger produirait des chiffres instables d'un mois à l'autre.
    expect(coutMensuelLisse({ type: 'annuelle', montantCents: 25000 })).toBe(2083)
    expect(2083 * 12).toBe(24996)
  })

  it('ne renvoie jamais de décimale', () => {
    for (const cents of [1, 7, 99, 12345, 99999]) {
      const lisse = coutMensuelLisse({ type: 'annuelle', montantCents: cents })
      expect(Number.isInteger(lisse)).toBe(true)
    }
  })
})


describe('agrégats de charges', () => {
  const compteCM = [
    charge({ nom: 'Netflix', montantCents: 1349, estPrelevee: true }),
    charge({ nom: 'EDF', montantCents: 9640, estPrelevee: true }),
    charge({ nom: 'Mutuelle', montantCents: 9732, estPrelevee: true }),
    charge({ nom: 'Loyer', montantCents: 85000 }),
    charge({ nom: 'Assurance habitation', montantCents: 3490 }),
    charge({ nom: 'Internet', montantCents: 3999 }),
    charge({ nom: 'Téléphone', montantCents: 1999 }),
    charge({ nom: 'Assurance auto', montantCents: 6230 }),
    charge({ nom: 'Impôt sur le revenu', montantCents: 24437 }),
  ]

  it('additionne, coche et soustrait correctement', () => {
    expect(totalDuCycle(compteCM)).toBe(145876)
    expect(dejaPreleve(compteCM)).toBe(20721)
    expect(resteASortir(compteCM)).toBe(125155)
  })

  it('vérifie que déjà prélevé + reste à sortir = total', () => {
    expect(dejaPreleve(compteCM) + resteASortir(compteCM)).toBe(totalDuCycle(compteCM))
  })

  it('ignore les charges inactives', () => {
    const avecInactive = [...compteCM, charge({ montantCents: 50000, actif: false })]
    expect(totalDuCycle(avecInactive)).toBe(145876)
    expect(resteASortir(avecInactive)).toBe(125155)
  })

  it("n'inclut jamais les charges annuelles dans le reste à sortir", () => {
    // Une charge annuelle est provisionnée, jamais prélevée depuis le compte courant.
    const avecAnnuelle = [...compteCM, charge({ type: 'annuelle', montantCents: 60000 })]
    expect(resteASortir(avecAnnuelle)).toBe(125155)
    expect(totalDuCycle(avecAnnuelle)).toBe(145876)
  })
})

describe('compte de provisions', () => {
  const provisions = [
    charge({ nom: 'Eau', type: 'annuelle', montantCents: 60000, jourPrelevement: null }),
    charge({ nom: 'Ordures', type: 'annuelle', montantCents: 30000, jourPrelevement: null }),
    charge({ nom: 'Voiture', type: 'annuelle', montantCents: 45000, jourPrelevement: null }),
    charge({ nom: 'Ramonage', type: 'annuelle', montantCents: 12000, jourPrelevement: null }),
  ]

  it('calcule le virement mensuel', () => {
    expect(provisionMensuelle(provisions)).toBe(12250)
  })

  it('calcule le total annuel couvert', () => {
    expect(totalAnnuel(provisions)).toBe(147000)
  })

  it('boucle : le virement mensuel × 12 couvre bien le total annuel', () => {
    expect(provisionMensuelle(provisions) * 12).toBe(totalAnnuel(provisions))
  })

  it('ignore les charges mensuelles du même compte', () => {
    const melange = [...provisions, charge({ type: 'mensuelle', montantCents: 5000 })]
    expect(provisionMensuelle(melange)).toBe(12250)
    expect(totalAnnuel(melange)).toBe(147000)
  })

  it("laisse un écart quand les montants ne sont pas divisibles par douze", () => {
    // 250 €/an → 20,83 €/mois → 249,96 € sur l'année. L'écart est assumé : le combler
    // produirait un virement permanent qui changerait de quelques centimes chaque mois.
    const irregulier = [charge({ type: 'annuelle', montantCents: 25000 })]
    expect(provisionMensuelle(irregulier) * 12).toBe(24996)
    expect(totalAnnuel(irregulier)).toBe(25000)
  })
})


describe('budgets', () => {
  it('calcule le reste à dépenser', () => {
    expect(resteADepenser(budget(40000, [12450, 3800, 8930, 1620, 4400]))).toBe(8800)
  })

  it('renvoie un reste négatif en cas de dépassement', () => {
    expect(resteADepenser(budget(12000, [2400, 8900, 1900]))).toBe(-1200)
  })

  it('gère un budget sans dépense', () => {
    expect(resteADepenser(budget(40000))).toBe(40000)
  })
})


describe('virementPermanent', () => {
  it('additionne les charges lissées et les budgets', () => {
    const charges = [
      charge({ montantCents: 2900 }),
      charge({ montantCents: 1199 }),
      charge({ montantCents: 299 }),
      charge({ montantCents: 899 }),
      charge({ montantCents: 6228 }),
    ]
    const budgets = [budget(40000), budget(40000), budget(25000), budget(12000)]
    // 115,25 € de charges + 1 170,00 € de budgets = 1 285,25 €
    expect(virementPermanent(charges, budgets)).toBe(128525)
  })

  it('lisse les charges annuelles au lieu de les compter au nominal', () => {
    const provisions = [
      charge({ type: 'annuelle', montantCents: 60000 }),
      charge({ type: 'annuelle', montantCents: 30000 }),
      charge({ type: 'annuelle', montantCents: 45000 }),
      charge({ type: 'annuelle', montantCents: 12000 }),
    ]
    expect(virementPermanent(provisions, [])).toBe(12250)
    // Sans lissage on aurait obtenu 1 470,00 € : c'est l'erreur que ce test interdit.
    expect(virementPermanent(provisions, [])).not.toBe(147000)
  })

  it("n'est pas affecté par l'état coché des charges", () => {
    const avant = [charge({ montantCents: 5000 }), charge({ montantCents: 3000 })]
    const apres = avant.map((c) => ({ ...c, estPrelevee: true }))
    expect(virementPermanent(apres, [])).toBe(virementPermanent(avant, []))
  })
})

describe('besoinDuCycle', () => {
  it('additionne prélèvements restants et budgets restants', () => {
    const charges = [
      charge({ montantCents: 2900 }),
      charge({ montantCents: 1199, estPrelevee: true }),
      charge({ montantCents: 299, estPrelevee: true }),
      charge({ montantCents: 899 }),
      charge({ montantCents: 6228 }),
    ]
    const budgets = [
      budget(40000, [31200]),
      budget(40000, [7800]),
      budget(25000, [19000]),
      budget(12000, [13200]),
    ]
    // 100,27 € de charges restantes + 458,00 € de budgets = 558,27 €
    expect(resteASortir(charges)).toBe(10027)
    expect(besoinDuCycle(charges, budgets)).toBe(55827)
  })
})


describe('repartir', () => {
  const helene = personne(1, 'Hélène', 280000)
  const francis = personne(2, 'Francis', 220000)
  const couple = [helene, francis]
  const C = 286651 // somme des virements permanents de la spec

  it('moitié-moitié', () => {
    const parts = repartir('moitie', couple, C)
    expect(parts.map((p) => p.partCents)).toEqual([143326, 143325])
    expect(parts.map((p) => p.resteAVivreCents)).toEqual([136674, 76675])
  })

  it('au prorata des revenus', () => {
    const parts = repartir('prorata_revenus', couple, C)
    expect(parts.map((p) => p.partCents)).toEqual([160525, 126126])
    expect(parts.map((p) => p.resteAVivreCents)).toEqual([119475, 93874])
  })

  it('reste à vivre égal', () => {
    const parts = repartir('reste_a_vivre_egal', couple, C)
    expect(parts.map((p) => p.partCents)).toEqual([173326, 113325])
    // L'écart de 1 centime est l'arrondi, inévitable sur un total impair.
    const [a, b] = parts.map((p) => p.resteAVivreCents)
    expect(Math.abs(a! - b!)).toBeLessThanOrEqual(1)
  })

  it('la somme des parts égale toujours exactement le total', () => {
    for (const mode of ['moitie', 'prorata_revenus', 'reste_a_vivre_egal'] as const) {
      for (const total of [286651, 100001, 7, 0, 999999]) {
        const somme = repartir(mode, couple, total).reduce((s, p) => s + p.partCents, 0)
        expect(somme).toBe(total)
      }
    }
  })

  it('retombe sur un partage égal si personne ne déclare de revenu', () => {
    const sansRevenu = [personne(1, 'A', 0), personne(2, 'B', 0)]
    expect(repartir('prorata_revenus', sansRevenu, 10000).map((p) => p.partCents)).toEqual([
      5000, 5000,
    ])
  })

  it('gère un foyer sans personne', () => {
    expect(repartir('moitie', [], 10000)).toEqual([])
  })
})
