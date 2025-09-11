# Backend Dockerfile
FROM node:18-alpine

# Install system dependencies required for canvas and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Create symlink for python (canvas package expects 'python' command)
RUN ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
