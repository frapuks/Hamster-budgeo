# HamsterBudgeo

Outil de gestion de budget familial, auto-hébergé.
Spec : [docs/brainstorm-produit.md](docs/brainstorm-produit.md) — plan : [docs/plan-implementation.md](docs/plan-implementation.md)

## Démarrer en local

```bash
cp .env.example .env      # déjà fait
npm install
npm run db:up             # Postgres dans Docker, port 5433 côté hôte
npm run migrate           # applique les migrations SQL
npm run seed              # charge le jeu de démonstration
npm run dev               # serveur sur 3001, front sur 5173
```

Puis http://localhost:5173

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur Fastify + front Vite, en parallèle |
| `npm run db:up` / `db:down` | Démarre / arrête PostgreSQL |
| `npm run db:logs` | Journal du conteneur base |
| `npm run migrate` | Applique les migrations `server/migrations/*.sql` |
| `npm run seed` | Recharge le jeu de démonstration (efface les données existantes) |
| `npm run typecheck` | TypeScript sur les deux workspaces |
| `npm test` | Vitest |

## Organisation

```
shared/    types, calculs purs et formatage — importés par le serveur ET le front
server/    Fastify + SQL écrit à la main (aucun ORM)
web/       React + MUI + TanStack Query
```

Deux conventions structurantes :

- **Les montants sont des entiers, en centimes.** Jamais de flottant. `formatEuros()` est
  le seul endroit qui produit une chaîne en euros.
- **Aucune requête SQL hors de `server/src/db/`.** Les routes appellent des fonctions nommées.

## Si Docker refuse de démarrer sous Windows

Docker Desktop dépend de WSL. Si le service est désactivé, dans un PowerShell administrateur :

```powershell
Set-Service -Name WSLService -StartupType Manual
Start-Service  -Name WSLService
```
