FROM node:20-alpine AS base
WORKDIR /app

# --- Dependencies layer ---
FROM base AS deps

RUN apk add --no-cache libc6-compat

# Copy lockfiles if present (npm, yarn, pnpm)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* ./ 2>/dev/null || true

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
      npm install; \
    fi

# --- Build layer ---
FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# --- Runtime image ---
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]


