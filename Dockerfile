# HamsterBudgeo — image unique servant l'API et le front.
#
# Construction en deux étapes : la première compile, la seconde n'embarque que le
# résultat et les dépendances d'exécution. L'image finale ne contient donc ni les
# sources TypeScript, ni React, ni MUI, ni les outils de compilation — ce qui compte
# sur la carte SD d'un Raspberry Pi.

# ── Étape 1 : compilation ────────────────────────────────────────────────────
FROM node:22-alpine AS compilation

WORKDIR /app

# Les manifestes d'abord : tant qu'ils ne changent pas, Docker réutilise la couche
# d'installation, qui est de loin la plus longue.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci

COPY shared/ shared/
COPY server/ server/
COPY web/ web/

RUN npm run build --workspace web \
 && npm run build --workspace server

# ── Étape 2 : exécution ──────────────────────────────────────────────────────
FROM node:22-alpine AS execution

WORKDIR /app

ENV NODE_ENV=production \
    TZ=Europe/Paris \
    SERVER_PORT=3001 \
    STATIC_DIR=/app/web \
    MIGRATIONS_DIR=/app/migrations

# Fuseau horaire : sans ce paquet, le conteneur reste en UTC et la date du jour bascule
# deux heures trop tôt — ce qui décalerait la date du dernier reset affichée.
RUN apk add --no-cache tzdata

# Dépendances d'exécution du serveur uniquement, installées hors espace de travail :
# fastify, postgres, bcryptjs et les deux greffons. Pas de React ni d'outillage.
COPY server/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund \
 && npm cache clean --force

COPY --from=compilation /app/server/dist/ ./
COPY --from=compilation /app/web/dist/ ./web/
COPY server/migrations/ ./migrations/

# `tsc` ne réécrit pas les alias de chemin : le JavaScript produit importe toujours
# `@hamsterbudgeo/shared/calculs.js`, que Node ne sait pas résoudre seul. On matérialise
# donc l'alias en un vrai paquet dans node_modules.
#
# Le nom compte : `@shared/calculs.js` ne fonctionnait pas, car `@` introduit un *scope*
# npm — Node cherchait un paquet nommé `calculs.js` dans le scope `@shared`. Il faut un
# nom en deux parties, `@scope/paquet`, d'où `@hamsterbudgeo/shared`.
RUN mkdir -p node_modules/@hamsterbudgeo/shared \
 && printf '{"name":"@hamsterbudgeo/shared","type":"module","exports":{"./*":"./*"}}' \
    > node_modules/@hamsterbudgeo/shared/package.json
COPY --from=compilation /app/server/dist/shared/src/ ./node_modules/@hamsterbudgeo/shared/

EXPOSE 3001

# Sonde de vie : `/api/health` interroge réellement PostgreSQL, donc un conteneur
# marqué sain est un conteneur qui parle à sa base.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>r.json()).then(s=>process.exit(s.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/src/index.js"]
