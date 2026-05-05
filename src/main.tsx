import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/lib/supabase";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import "@/index.css";

// Service workers silently no-op inside native WebViews — registering is safe.
registerSW({ immediate: true });

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
