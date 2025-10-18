# Use official Node.js LTS image (Node 20)
FROM node:20-bullseye

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libopencv-dev \
    python3 \
    git \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
