# AgentixOS

## 1) Pokretanje backend/gateway/frontend stack-a

```bash
cd infra
docker compose up --build
```

Servisi:
- Frontend PWA: http://localhost:3000
- Gateway: http://localhost:8080/health
- Backend: http://localhost:8000/health
- tusd upload: http://localhost:1080/files/
- MinIO console: http://localhost:9001

## 2) Build APK (Android)

Preduvjeti na host mašini:
- Node.js 20+
- Java 21
- Android SDK + `adb` (platform-tools)
- Export varijabla: `ANDROID_HOME` ili `ANDROID_SDK_ROOT`

Koraci:

```bash
# 1) Capacitor + Android project setup
./scripts/android/setup_android.sh

# 2) Build debug APK
./scripts/android/build_apk.sh
```

Generisani APK:

```text
apps/mobile-pwa/android/app/build/outputs/apk/debug/app-debug.apk
```

## 3) Instalacija APK na telefon (USB)

Na telefonu:
- Uključi Developer options
- Uključi USB debugging

Na računaru:

```bash
./scripts/android/install_phone.sh
```

Ručna instalacija (alternativa):

```bash
adb install -r apps/mobile-pwa/android/app/build/outputs/apk/debug/app-debug.apk
```

## 4) WiFi ADB instalacija (opcionalno)

```bash
adb tcpip 5555
adb connect <PHONE_IP>:5555
adb install -r apps/mobile-pwa/android/app/build/outputs/apk/debug/app-debug.apk
```


## 5) GitHub APK build

Workflow fajl: `.github/workflows/android-apk.yml`

Trigger opcije:
- automatski na `push` u `main` (ako se mijenja `apps/mobile-pwa/**`, `scripts/android/**` ili workflow)
- ručno preko **Actions > Android APK Build > Run workflow**

Artifact naziv u GitHub Actions:
- `agentixos-debug-apk`


## 6) APK troubleshoot (ako "ništa ne radi")

Najčešći problem: APK pokušava da se spoji na pogrešan backend URL.

- Emulator: koristi `http://10.0.2.2:8080`
- Fizički telefon: koristi LAN IP računara npr. `http://192.168.1.10:8080`

U aplikaciji:
1. Klikni `☰`
2. Upiši `Gateway URL`
3. Klikni `Save + Reconnect`

Ako koristiš fizički telefon, backend/gateway moraju biti dostupni na mreži (ne samo localhost).
