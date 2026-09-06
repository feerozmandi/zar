# syntax=docker/dockerfile:1
# ── Xennic Web (Next.js 16) — بیلد چندمرحله‌ای با pnpm ──────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/shared/package.json packages/shared/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --frozen-lockfile --filter @xennic/web...

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=/api/proxy
RUN pnpm --filter @xennic/shared build && pnpm --filter @xennic/design-tokens build \
 && pnpm --filter @xennic/web build

# خروجی standalone خودش dependencyهای لازم را در بر دارد؛ فقط static و public افزوده می‌شوند.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S xennic && adduser -S xennic -G xennic
COPY --from=build --chown=xennic:xennic /app/apps/web/.next/standalone ./
COPY --from=build --chown=xennic:xennic /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=xennic:xennic /app/apps/web/public ./apps/web/public
USER xennic
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
