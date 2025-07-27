# ---- 1. Build Stage (Client) ----
FROM oven/bun:1.1.18-alpine AS builder 
WORKDIR /client

# Copy dependency manifests
COPY package.json bun.lock* ./
# Install dependencies
RUN bun install --frozen-lockfile

# Copy ALL source code AFTER dependencies are installed
COPY . .

# Run the build command for your client app
# This generates the final build artifacts (e.g., in .next folder)
RUN bun run build 

# ---- 2. Production Stage (Client) ----
FROM oven/bun:1.1.18-alpine AS production 
WORKDIR /client


COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile


# Copy the generated build output from the builder stage
COPY --from=builder /client/.next ./.next
COPY --from=builder /client/public ./public

EXPOSE 3000
CMD ["bun", "run", "start"]