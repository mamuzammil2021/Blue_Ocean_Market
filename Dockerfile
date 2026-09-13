FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ chromium fonts-noto-cjk fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p data uploads

ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium
EXPOSE 3000
CMD ["npm","start"]
