import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches render/runtime errors in a screen so one broken component can't blank
 * the whole app. Keyed by the active tab in the shell, so switching tabs resets
 * it. Offers an in-place retry and a hard reload as a last resort.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Surfaces in the console now; wire to Sentry/monitoring when added.
    console.error("[nm] screen crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: "calc(48px + env(safe-area-inset-top)) 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
        <span style={{ fontSize: 42 }}>😕</span>
        <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-.01em" }}>Something went wrong</div>
        <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.55, maxWidth: 280 }}>
          This screen hit an unexpected error. You can try again, or reload the app.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button type="button" onClick={() => this.setState({ error: null })} className="nm-press" style={{ all: "unset", cursor: "pointer", padding: "11px 20px", borderRadius: "var(--nm-r-md)", background: "var(--nm-surface2)", color: "var(--nm-text)", font: "600 14px var(--nm-font-text)" }}>
            Try again
          </button>
          <button type="button" onClick={() => window.location.reload()} className="nm-press" style={{ all: "unset", cursor: "pointer", padding: "11px 20px", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14px var(--nm-font-text)" }}>
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
