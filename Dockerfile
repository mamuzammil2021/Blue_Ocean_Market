FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHON=/usr/bin/python3

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p data uploads

EXPOSE 3000

CMD ["npm","start"]