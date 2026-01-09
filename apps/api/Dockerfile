# Stage 1: Build the application
FROM node:24 as builder

# Set the working directory
WORKDIR /app

# Copy root dependency files
COPY package.json yarn.lock ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY .yarn ./

# Install all dependencies (including devDependencies needed for the build)
# Using --immutable to ensure reproducible installs
RUN yarn install --immutable

# Copy the rest of the monorepo source code
COPY . .

# Build the 'api' application in production mode
# This will create a self-contained build in dist/apps/api
RUN npx nx build api

# ---

# Stage 2: Create the final production image
FROM node:24-alpine

# Set the working directory
WORKDIR /app

# Nx automatically generates a package.json with only the production
# dependencies needed for the specific app. Copy it and install.
COPY --from=builder /app/dist/apps/api/package.json ./
COPY --from=builder /app/dist/apps/api/yarn.lock ./

# Install only production dependencies
RUN yarn workspaces focus --all --production

# Copy the bundled application code from the builder stage
COPY --from=builder /app/dist/apps/api .

# Expose the port the app runs on (update if different)
EXPOSE 3000

# The command to start the service
CMD ["node", "main.js"]
