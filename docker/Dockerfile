# ─── Build Stage ───────────────────────────────────────────

FROM node:20-alpine AS base
RUN corepack enable

# ─── Dependencies ─────────────────────────────────────────

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# ponytail: copy schema so postinstall (prisma generate) works
COPY prisma/schema.prisma ./prisma/
RUN pnpm install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm prisma generate
RUN pnpm build

# ─── Production ───────────────────────────────────────────

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy from builder (has correct Prisma client) instead of deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./

# Create upload directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node_modules/.bin/next", "start"]
