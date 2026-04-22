#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$ROOT_DIR/apps/mobile-pwa"

cd "$APP_DIR"

npm install
npm run build
npx cap sync android

cd android
./gradlew assembleDebug

APK_PATH="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "APK build failed: $APK_PATH not found" >&2
  exit 1
fi

echo "APK built: $APK_PATH"
