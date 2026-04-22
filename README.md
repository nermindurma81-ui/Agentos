# AgentixOS

## Run stack

```bash
cd infra
docker compose up --build
```

## Services

- Frontend PWA: http://localhost:3000
- Gateway: http://localhost:8080/health
- Backend: http://localhost:8000/health
- tusd upload: http://localhost:1080/files/
- MinIO console: http://localhost:9001

## Android APK path

Use Capacitor in `apps/mobile-pwa`:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init AgentixOS com.agentixos.app
npx cap add android
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```
