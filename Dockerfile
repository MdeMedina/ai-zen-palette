FROM node:22-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Declare build arguments for Vite env vars (baked in during build)
ARG VITE_API_BASE_URL
ARG VITE_USE_MOCKS

# Set env vars for build context
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Run the native Vinxi server in production
CMD ["npx", "vinxi", "start"]
