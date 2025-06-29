# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code (after prisma so Docker cache works better)
COPY . .

# Build TypeScript
RUN npm run build

# Expose port for Express
EXPOSE 3000

# Start app (real command is overridden by docker-compose)
CMD ["node", "dist/index.js"]