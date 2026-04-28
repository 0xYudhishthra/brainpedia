# syntax=docker/dockerfile:1.7
# Brainpedia web — monorepo-aware build.
# Built from the monorepo root so workspace deps (@brainpedia/*) resolve.

FROM oven/bun:1.3-alpine AS deps
WORKDIR /repo
COPY package.json bun.lock* ./
COPY turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/obsidian-parser/package.json ./packages/obsidian-parser/
COPY packages/storage-0g/package.json ./packages/storage-0g/
COPY packages/compute-0g/package.json ./packages/compute-0g/
COPY packages/ens/package.json ./packages/ens/
COPY packages/axl/package.json ./packages/axl/
RUN bun install

FROM oven/bun:1.3-alpine AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN bun run --cwd apps/web build

FROM oven/bun:1.3-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /repo /repo
EXPOSE 3000
CMD ["bun", "run", "--cwd", "apps/web", "start"]
