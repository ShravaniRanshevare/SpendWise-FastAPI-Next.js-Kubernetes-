# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production=false

# Copy source
COPY . .

# Build Next.js
RUN npm run build


# ---------- RUNTIME STAGE ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy the necessary build output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]

