FROM node:22-bullseye

# Install OS dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libgtk-3-dev \
    libatlas-base-dev \
    gfortran \
    python3

WORKDIR /usr/src/app

COPY package*.json ./

# Install opencv4nodejs (builds from source)
RUN npm install --unsafe-perm

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
