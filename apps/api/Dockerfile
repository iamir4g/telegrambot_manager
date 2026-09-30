# Build context: repository root
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter @finnap/api... --frozen-lockfile

COPY apps/api ./apps/api
RUN pnpm --filter @finnap/api prisma:generate \
  && pnpm --filter @finnap/api build \
  && pnpm --filter @finnap/api deploy --prod /deploy \
  && cd /deploy && npx prisma generate

FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -S finnap && adduser -S finnap -G finnap \
  && mkdir -p /data && chown -R finnap:finnap /data

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build --chown=finnap:finnap /deploy /app
RUN chmod +x /app/docker-entrypoint.sh

USER finnap
EXPOSE 3001
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
