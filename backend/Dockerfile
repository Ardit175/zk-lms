FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache-friendly)
COPY package*.json ./
RUN npm install

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]
