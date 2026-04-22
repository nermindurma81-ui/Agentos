#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$ROOT_DIR/apps/mobile-pwa"
ANDROID_DIR="$APP_DIR/android"
LOCAL_PROPS="$ANDROID_DIR/local.properties"

require_java21() {
  if ! command -v java >/dev/null 2>&1; then
    echo "Java nije instalirana. Potreban je JDK 21." >&2
    exit 1
  fi
  local major
  major=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | awk -F. '{print $1}')
  if [ "$major" -lt 21 ]; then
    echo "Detektovan JDK $major. Potreban je JDK 21+." >&2
    exit 1
  fi
}

require_java21

cd "$APP_DIR"

npm install
npm run build
npx cap sync android


APP_GRADLE="$ANDROID_DIR/app/build.gradle"
if ! grep -q "kotlin-stdlib-jdk8" "$APP_GRADLE"; then
  cat >> "$APP_GRADLE" <<'GRADLE'
configurations.all {
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
}
GRADLE
fi

if [ ! -f "$LOCAL_PROPS" ]; then
  SDK_PATH="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
  if [ -d "$SDK_PATH" ]; then
    cat > "$LOCAL_PROPS" <<PROP
sdk.dir=$SDK_PATH
PROP
  else
    echo "Android SDK not found. Define ANDROID_HOME or ANDROID_SDK_ROOT." >&2
    exit 2
  fi
fi

cd android
./gradlew assembleDebug

APK_PATH="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
  echo "APK build failed: $APK_PATH not found" >&2
  exit 1
fi

echo "APK built: $APK_PATH"
