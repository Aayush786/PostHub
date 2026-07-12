# Use official Node.js LTS image
FROM node:20-slim

# Install build dependencies for better-sqlite3 compilation if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package manager configs
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Create uploads directory (optional, since it will be temporary or locally cached)
RUN mkdir -p uploads

# Expose the standard port
EXPOSE 8080

# Start server command
CMD ["npm", "start"]
