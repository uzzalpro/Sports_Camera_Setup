# Dockerfile for Vite + canvas project
FROM node:22

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install build dependencies and npm deps
RUN apt-get update && apt-get install -y python3 make g++ \
  && npm install \
  && apt-get remove -y python3 make g++ \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

# Install serve globally
RUN npm install -g serve

# Copy full frontend source
COPY frontend/ .

# Build the Vite project
RUN npm run build

# Expose the port Vite uses in production (serve)
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist"]
