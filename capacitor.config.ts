import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const configuredServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();
let serverUrl: URL | undefined;

if (configuredServerUrl) {
  serverUrl = new URL(configuredServerUrl);
  if (!["http:", "https:"].includes(serverUrl.protocol)) {
    throw new Error("CAPACITOR_SERVER_URL must use http or https.");
  }
}

const config: CapacitorConfig = {
  appId: "com.socialcommerce.app",
  appName: "Social Commerce",
  webDir: "capacitor-web",
  loggingBehavior: "debug",
  android: {
    backgroundColor: "#ffffffff",
  },
  server: {
    ...(serverUrl
      ? {
          url: serverUrl.toString().replace(/\/$/, ""),
          cleartext: serverUrl.protocol === "http:",
        }
      : {}),
    errorPath: "offline.html",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#ffffffff",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#ffffffff",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
