# Single-deployable image: the Express/ws signaling server serves both the
# WebSocket endpoint and the built static client from one process. The
# server runs its TypeScript source directly via tsx (see server/package.json)
# rather than a separate compile step, so this image keeps the monorepo's
# source layout intact (workspace symlinks resolve @planning-poker/shared to
# shared/src) instead of trying to bundle/flatten it.

FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/server ./server
COPY --from=build /app/client/package.json ./client/package.json
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/package.json ./package.json

EXPOSE 3001
CMD ["npm", "run", "start", "-w", "server"]
