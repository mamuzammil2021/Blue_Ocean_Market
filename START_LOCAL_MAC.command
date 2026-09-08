#!/bin/bash
cd "$(dirname "$0")" || exit 1

if [ ! -f .env ]; then
  echo "Creating local-only .env from safe V30.18 test defaults..."
  LOCAL_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" 2>/dev/null)"
  if [ -z "$LOCAL_SECRET" ]; then LOCAL_SECRET="blue-ocean-local-only-secret-change-before-production-3018"; fi
  cat > .env <<ENV
JWT_SECRET=$LOCAL_SECRET
ADMIN_EMAIL=admin@blueocean.local
ADMIN_PASSWORD=BlueOceanAdmin123!
LOCAL_TEST_MODE=true
LOCAL_TEST_ADMIN_EMAIL=admin@blueocean.local
LOCAL_TEST_ADMIN_PASSWORD=BlueOceanAdmin123!
NODE_ENV=development
DATA_DIR=./data
UPLOAD_DIR=./uploads
SEED_DEMO_USERS=false
DEMO_USER_PASSWORD=BlueOceanTest123!
SEED_DEMO_DATA=false
ENV
  chmod 600 .env 2>/dev/null || true
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install || exit 1
fi

echo "Running Blue Ocean Market V30.18.0 release QA..."
npm run qa:current || exit 1

echo "Starting Blue Ocean Market V30.18.0 Local Test"
echo "CEO: admin@blueocean.local"
echo "Password: BlueOceanAdmin123!"
npm start
