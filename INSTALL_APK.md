# APK instalacija (AgentixOS)

## Fast path

```bash
./scripts/android/setup_android.sh
./scripts/android/build_apk.sh
./scripts/android/install_phone.sh
```

## Output

```text
apps/mobile-pwa/android/app/build/outputs/apk/debug/app-debug.apk
```

## Ako `adb` ne vidi uređaj

```bash
adb kill-server
adb start-server
adb devices
```

## Ako želiš ručno sideload

```bash
adb install -r apps/mobile-pwa/android/app/build/outputs/apk/debug/app-debug.apk
```
