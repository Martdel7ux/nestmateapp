import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/lib/supabase";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import "@/index.css";

// A service worker is great for the web PWA, but inside a native WebView it
// caches the bundle and serves STALE assets after every rebuild (the native app
// already ships its assets locally). So register it on web only, and on native
// proactively unregister any worker + purge caches left behind by an old build.
if (Capacitor.isNativePlatform()) {
  void (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch { /* best-effort cleanup */ }
  })();
} else {
  registerSW({ immediate: true });
}

// On native, Supabase OAuth completes in the system browser then redirects to
// com.nestmate.app://login-callback. The OS delivers that URL here; we hand it
// to Supabase which extracts the PKCE code and exchanges it for a session.
if (Capacitor.isNativePlatform()) {
  App.addListener("appUrlOpen", async ({ url }) => {
    if (url.startsWith("com.nestmate.app://") && supabase) {
      await supabase.auth.exchangeCodeForSession(url);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
);
