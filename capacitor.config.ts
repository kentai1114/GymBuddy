import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.gymbuddy',
  appName: 'GymBuddy',
  webDir: 'dist',
  backgroundColor: '#0C0C0E',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
  },
  ios: {
    minVersion: '15.0',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'App',
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: '6.2',
      },
    },
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0C0C0E',
    },
  },
}

export default config
