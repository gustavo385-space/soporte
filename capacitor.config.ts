import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soporte.enterprise',
  appName: 'Soporte IT Enterprise',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#050608',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#00f2fe'
    }
  }
};

export default config;
