#!/bin/bash
cd "$(dirname "$0")" || exit 1
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install || exit 1
fi
echo "Running Blue Ocean Market V30.16.0 release QA..."
npm run qa:current || exit 1
echo "Starting Blue Ocean Market V30.16.0 Local Test"
echo "CEO: admin@blueocean.local"
echo "Password: BlueOceanAdmin123!"
npm start
