import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sparksuite.app',
  appName: 'SparkSuite',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
