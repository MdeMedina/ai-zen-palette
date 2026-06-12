# ---- build stage ----
# VITE_* vars (VITE_API_BASE_URL, VITE_USE_MOCKS) are read from .env at build
# time and baked into the client bundle. Change .env -> rebuild the image.
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# node-server preset -> self-contained dist/server/index.mjs (no node_modules at runtime)
ENV NITRO_PRESET=node-server
RUN npm run build

# ---- runtime stage ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# nitro's node-server output bundles all deps into dist/ — only this is needed.
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server/index.mjs"]
