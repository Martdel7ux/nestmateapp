import { Preferences } from "@capacitor/preferences";

// Durable key-value storage.
//
// On native (Capacitor) this is backed by UserDefaults (iOS) / SharedPreferences
// (Android), which survive force-quits and aren't subject to WebView storage
// eviction — unlike `localStorage`, which is unreliable on native WebViews. On
// web, the plugin transparently falls back to localStorage. Every call also has
// a localStorage safety fallback in case the plugin throws.

export async function storageGet(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({ key, value });
  } catch {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore quota / availability errors */
    }
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
