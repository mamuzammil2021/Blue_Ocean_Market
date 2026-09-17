#!/bin/bash
set -e
cd "$(dirname "$0")" || exit 1

if [ ! -f .env ]; then
  echo "Creating local-only .env for Blue Ocean Market V30.32.0..."
  LOCAL_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" 2>/dev/null || true)"
  LOCAL_PASSWORD="$(node -e "console.log('BO-'+require('crypto').randomBytes(12).toString('base64url')+'!9a')" 2>/dev/null || true)"
  LOCAL_ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" 2>/dev/null || true)"
  if [ -z "$LOCAL_SECRET" ] || [ -z "$LOCAL_PASSWORD" ] || [ -z "$LOCAL_ENCRYPTION_KEY" ]; then
    echo "Node.js 22 is required to create secure local credentials."
    exit 1
  fi
  cat > .env <<ENV
JWT_SECRET=$LOCAL_SECRET
APP_ENCRYPTION_KEY=$LOCAL_ENCRYPTION_KEY
APP_BASE_URL=http://localhost:3000
ADMIN_EMAIL=admin@blueocean.local
ADMIN_PASSWORD=$LOCAL_PASSWORD
LOCAL_TEST_MODE=true
LOCAL_TEST_ADMIN_EMAIL=admin@blueocean.local
LOCAL_TEST_ADMIN_PASSWORD=$LOCAL_PASSWORD
NODE_ENV=development
APP_ENV=development
ALLOW_TEST_DATA_RESET=true
TEST_RESET_BACKUP_RETENTION=3
DATA_DIR=./data
UPLOAD_DIR=./uploads
SEED_DEMO_USERS=false
DEMO_USER_PASSWORD=$LOCAL_PASSWORD
SEED_DEMO_DATA=false
ENV
  chmod 600 .env 2>/dev/null || true
  echo "Local CEO: admin@blueocean.local"
  echo "Local password: $LOCAL_PASSWORD"
  echo "The generated .env is local-only. Keep this password for this test instance."
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm ci || exit 1
fi

echo "Running Blue Ocean Market V30.32.0 release QA..."
npm run qa:current || exit 1

echo "Starting Blue Ocean Market V30.32.0 Local Test"
npm start
