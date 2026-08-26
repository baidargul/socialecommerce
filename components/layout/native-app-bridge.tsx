"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export function NativeAppBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backButtonListener: PluginListenerHandle | undefined;
    let cancelled = false;

    void (async () => {
      await Promise.allSettled([
        StatusBar.setOverlaysWebView({ overlay: false }),
        StatusBar.setBackgroundColor({ color: "#ffffff" }),
        StatusBar.setStyle({ style: Style.Dark }),
        Keyboard.setResizeMode({ mode: KeyboardResize.Body }),
      ]);

      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.minimizeApp();
      });
      if (cancelled) await listener.remove();
      else backButtonListener = listener;

      await SplashScreen.hide();
    })();

    return () => {
      cancelled = true;
      if (backButtonListener) void backButtonListener.remove();
    };
  }, []);

  return null;
}
