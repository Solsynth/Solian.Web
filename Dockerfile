# Stage 1: Build the application
FROM oven/bun:1 as builder
WORKDIR /app

# Copy dependency definition files
COPY package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the Nuxt application
RUN bun run build

# Stage 2: Create the production image
FROM node:20-slim as runner
WORKDIR /app

# Copy the built output from the builder stage
COPY --from=builder /app/.output ./.output

# Set environment variables for the Nuxt server
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# The command to run the application
CMD ["node", ".output/server/index.mjs"]
