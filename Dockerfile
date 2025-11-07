# Development stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and config files (will be overridden by volume mounts in docker-compose)
COPY . .

# Expose port
EXPOSE 3000

# Start the application in watch mode for hot reload
CMD ["npm", "run", "start:dev"]

