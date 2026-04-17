import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaoos.app',
  appName: 'ZAO OS',
  webDir: 'out',

  server: {
    // Production: use static export in 'out' directory
    // Development: uncomment below to point at local dev server
    // url: 'http://192.168.1.X:3000',
    // cleartext: true,
    androidScheme: 'https',
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a1628',
    preferredContentMode: 'mobile',
  },

  android: {
    backgroundColor: '#0a1628',
    allowMixedContent: false,
  },
};

export default config;
