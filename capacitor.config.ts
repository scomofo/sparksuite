import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chordspark.app',
  appName: 'ChordSpark',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
