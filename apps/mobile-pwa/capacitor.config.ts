import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agentixos.app',
  appName: 'AgentixOS',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
