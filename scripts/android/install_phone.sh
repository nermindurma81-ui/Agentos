#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APK_PATH="$ROOT_DIR/apps/mobile-pwa/android/app/build/outputs/apk/debug/app-debug.apk"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android platform-tools first." >&2
  exit 1
fi

if [ ! -f "$APK_PATH" ]; then
  echo "APK not found at $APK_PATH. Run scripts/android/build_apk.sh first." >&2
  exit 1
fi

adb devices
adb install -r "$APK_PATH"

echo "Installed: $APK_PATH"
