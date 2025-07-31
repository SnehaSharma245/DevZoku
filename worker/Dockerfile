# ---- 1. Build Stage ----

FROM oven/bun:1.2.19 AS builder

WORKDIR /worker

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

# Build your main application
RUN bun run build

# ---- 2. Production Stage ----

FROM oven/bun:1.2.19-alpine AS production

WORKDIR /worker

# Copy only necessary files for production
COPY package.json bun.lock ./

# Install production dependencies.
RUN bun install --production --frozen-lockfile

# Copy the built main application from the builder stage
COPY --from=builder /worker/dist ./dist

# Sirf main application ko start karein
CMD ["bun","run","start"] 