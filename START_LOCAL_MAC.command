#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

if [ ! -f .env ]; then
  echo "Creating local-only .env for Blue Ocean Market V30.20.0..."
  LOCAL_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" 2>/dev/null || true)"
  LOCAL_PASSWORD="$(node -e "console.log('BO-'+require('crypto').randomBytes(12).toString('base64url')+'!9a')" 2>/dev/null || true)"
  if [ -z "$LOCAL_SECRET" ] || [ -z "$LOCAL_PASSWORD" ]; then
    echo "Node.js 22 is required to create secure local credentials."
    exit 1
  fi
  cat > .env <<ENV
JWT_SECRET=$LOCAL_SECRET
ADMIN_EMAIL=admin@blueocean.local
ADMIN_PASSWORD=$LOCAL_PASSWORD
LOCAL_TEST_MODE=true
LOCAL_TEST_ADMIN_EMAIL=admin@blueocean.local
LOCAL_TEST_ADMIN_PASSWORD=$LOCAL_PASSWORD
NODE_ENV=development
DATA_DIR=./data
UPLOAD_DIR=./uploads
SEED_DEMO_USERS=false
DEMO_USER_PASSWORD=$LOCAL_PASSWORD
SEED_DEMO_DATA=false
ENV
  chmod 600 .env 2>/dev/null || true
  echo "Local CEO: admin@blueocean.local"
  echo "Local password: $LOCAL_PASSWORD"
  echo "The generated .env is ignored by Git. Keep this password for this local test instance."
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm ci || exit 1
fi

echo "Running Blue Ocean Market V30.20.0 release QA..."
npm run qa:current || exit 1

echo "Starting Blue Ocean Market V30.20.0 Local Test"
npm start
