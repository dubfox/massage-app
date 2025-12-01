FROM node:20-alpine AS base
WORKDIR /app

# --- Dependencies layer ---
FROM base AS deps

RUN apk add --no-cache libc6-compat

# Copy package manifest and lock file (npm-based install)
COPY package.json package-lock.json ./ 

RUN npm ci

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


