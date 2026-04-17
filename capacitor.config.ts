import type { CapacitorConfig } from '@capacitor/cli';

// Server URL mode: native shell loads zaoos.com in a WebView.
// All API routes, SSR, middleware work as-is. Web updates deploy instantly
// without App Store review. Native shell adds: background audio, push, App Store presence.
//
// For local development, set CAP_SERVER_URL to your local IP:
//   CAP_SERVER_URL=http://192.168.1.X:3000 npx cap sync

const serverUrl = process.env.CAP_SERVER_URL || 'https://zaoos.com';
const isDev = !!process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.zaoos.app',
  appName: 'ZAO OS',
  webDir: 'public', // fallback for assets only, main content comes from server URL

  server: {
    url: serverUrl,
    cleartext: isDev, // allow HTTP for local dev only
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
