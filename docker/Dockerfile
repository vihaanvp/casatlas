# =============================================================================
# CASAtlas — Dockerfile
# Multi-stage build for a small, secure production image.
# =============================================================================

# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# ponytail: copy schema + config so postinstall (prisma generate) works
COPY prisma/schema.prisma ./prisma/
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile
RUN DATABASE_URL="postgresql://user:password@localhost:5432/dummy" pnpm prisma generate

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://user:password@localhost:5432/dummy"
RUN pnpm build

# ---- Production ----
FROM base AS runner
WORKDIR /app

# OCI image labels for GitHub package registry
LABEL org.opencontainers.image.source=https://github.com/vihaanvp/CASAtlas
LABEL org.opencontainers.image.description="CASAtlas — IB CAS portfolio tracker"
LABEL org.opencontainers.image.licenses=MIT

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy from builder (has correct Prisma client) instead of deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./

# Create upload directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ---- run migrations then start the app ----
# Fail fast on missing secrets; warn on dev-only settings that must never
# ship to a shared host (see docker/.env.example).
CMD ["sh", "-c", "if [ -z \"$AUTH_SECRET\" ] || [ \"$AUTH_SECRET\" = \"replace-with-openssl-rand-base64-32\" ]; then echo 'FATAL: AUTH_SECRET is not set. Copy docker/.env.example to docker/.env and set a real value (openssl rand -base64 32).' >&2; exit 1; fi; if [ \"$AUTH_DEV_LOGIN\" = \"true\" ]; then echo 'WARNING: AUTH_DEV_LOGIN=true — passwordless dev login is enabled. Never use this in production.' >&2; fi; case \"$NEXT_PUBLIC_APP_URL\" in http://localhost*|http://127.0.0.1*) echo \"WARNING: NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL looks like a dev URL. Set it to the public URL of this host or OAuth callbacks and links will break.\" >&2;; esac; npx prisma migrate deploy && npx next start"]
