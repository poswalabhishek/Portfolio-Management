# Use official Node.js image as a base
FROM node:latest AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the remaining files to the working directory
COPY . .

# Build the React app
RUN npm run build

# Production environment
FROM nginx:alpine

# Copy the built app from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]