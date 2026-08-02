# ============================================================
# Manhal Academy — Classroom Realtime Service (socket.io)
# Runs the socket.io server on port 3003 (chat, whiteboard,
# presence, code sandbox, educational platforms, focus alerts).
#
# The Next.js frontend connects to the SAME origin with
# `?XTransformPort=3003`; the Caddy proxy routes those requests
# here. Health check: GET /health
# ============================================================

FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.ts ./

EXPOSE 3003
# Node >= 22.6 runs TypeScript directly via type stripping
CMD ["node", "--experimental-strip-types", "index.ts"]
