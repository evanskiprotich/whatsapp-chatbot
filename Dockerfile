# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build Next.js application
RUN npm run build

# Expose the Next.js port
EXPOSE 3000

# Start Next.js
CMD ["npm", "run", "start"]
