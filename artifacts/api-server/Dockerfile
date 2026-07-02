FROM node:22-slim AS build

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json tsconfig.base.json ./
COPY artifacts/api-server/package.json artifacts/api-server/build.mjs artifacts/api-server/tsconfig.json ./artifacts/api-server/
COPY lib/db/package.json lib/db/tsconfig.json ./lib/db/
COPY lib/api-zod/package.json lib/api-zod/tsconfig.json ./lib/api-zod/

RUN pnpm install --frozen-lockfile

COPY artifacts/api-server ./artifacts/api-server
COPY lib ./lib

RUN pnpm --filter @workspace/api-server run build

FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/artifacts/api-server/dist ./dist

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
