#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$ROOT_DIR/apps/mobile-pwa"

cd "$APP_DIR"

npm install
npm install @capacitor/core @capacitor/cli @capacitor/android

if [ ! -f capacitor.config.ts ]; then
  echo "cap config missing" >&2
  exit 1
fi

if [ ! -d android ]; then
  npx cap add android
fi

echo "Android setup completed in $APP_DIR/android"
