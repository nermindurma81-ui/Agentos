#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$ROOT_DIR/apps/mobile-pwa"
ANDROID_DIR="$APP_DIR/android"

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

SDK_PATH="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
if [ -d "$SDK_PATH" ]; then
  cat > "$ANDROID_DIR/local.properties" <<PROP
sdk.dir=$SDK_PATH
PROP
  echo "Android SDK configured at: $SDK_PATH"
else
  echo "Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT before build." >&2
fi

echo "Android setup completed in $APP_DIR/android"
