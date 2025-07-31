# ---- 1. Build Stage ----

FROM oven/bun:1.2.19 AS builder

WORKDIR /server

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

# Build your main application
RUN bun run build 

# ---- 2. Production Stage ----

FROM oven/bun:1.2.19-alpine AS production

ENV NODE_ENV=production

WORKDIR /server

# Copy only necessary files for production
COPY package.json bun.lock ./

# Install production dependencies.
RUN bun install --production --frozen-lockfile

# Copy the built main application from the builder stage
COPY --from=builder /server/dist ./dist

# ** Ye line dobara add karein **
# COPY --from=builder /server/src ./src


EXPOSE 8000

# Sirf main application ko start karein
CMD ["bun", "start"] 