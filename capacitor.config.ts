import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nestmate.app",
  appName: "NestMate",
  webDir: "dist",
  server: {
    // Use https scheme on Android so cookies and secure storage work correctly
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      showSpinner: false,
    },
    StatusBar: {
      // Match the app's dark header colour
      backgroundColor: "#0f172a",
      style: "DARK",
      overlaysWebView: false,
    },
  },
};

export default config;
