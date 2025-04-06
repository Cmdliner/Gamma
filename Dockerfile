# Using the official Node.js image as base
FROM node:latest

# Install Bun (it's better to use their official installation method)
RUN npm install -g bun

# Create and set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application
COPY . .

# Install PM2 using Bun (globally)
RUN bun add -g pm2

# Copy your PM2 ecosystem file (make sure this exists in your project)
COPY ecosystem.config.js .

# Expose the port your app runs on
EXPOSE 4000

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]