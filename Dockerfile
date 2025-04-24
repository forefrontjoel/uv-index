# Base Node.js image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be passed at build time for Next.js
ARG NEXT_PUBLIC_METEOMATICS_USERNAME
ARG NEXT_PUBLIC_METEOMATICS_PASSWORD
ENV NEXT_PUBLIC_METEOMATICS_USERNAME=$NEXT_PUBLIC_METEOMATICS_USERNAME
ENV NEXT_PUBLIC_METEOMATICS_PASSWORD=$NEXT_PUBLIC_METEOMATICS_PASSWORD

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app will run on
EXPOSE 3000

# Environment variables for runtime
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NEXT_PUBLIC_METEOMATICS_USERNAME=$NEXT_PUBLIC_METEOMATICS_USERNAME
ENV NEXT_PUBLIC_METEOMATICS_PASSWORD=$NEXT_PUBLIC_METEOMATICS_PASSWORD

# Start the application
CMD ["node", "server.js"]