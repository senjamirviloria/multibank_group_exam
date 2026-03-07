FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_AUTH_API_URL=http://localhost:4001
ARG NEXT_PUBLIC_MARKET_API_URL=http://localhost:4002
ARG NEXT_PUBLIC_MARKET_WS_URL=ws://localhost:4002/ws
ARG NEXT_PUBLIC_HISTORY_CACHE_TTL_MS=30000
ARG NEXT_PUBLIC_LOCAL_CACHE_SECRET=multibank-local-cache-secret
ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_MARKET_API_URL=$NEXT_PUBLIC_MARKET_API_URL
ENV NEXT_PUBLIC_MARKET_WS_URL=$NEXT_PUBLIC_MARKET_WS_URL
ENV NEXT_PUBLIC_HISTORY_CACHE_TTL_MS=$NEXT_PUBLIC_HISTORY_CACHE_TTL_MS
ENV NEXT_PUBLIC_LOCAL_CACHE_SECRET=$NEXT_PUBLIC_LOCAL_CACHE_SECRET
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3110
CMD ["./docker-entrypoint.sh"]
