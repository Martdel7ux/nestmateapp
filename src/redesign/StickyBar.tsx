import type { CSSProperties, ReactNode } from "react";

/** Offset that keeps a pinned control level with the screen's top padding. */
export const stickyTop = "calc(20px + env(safe-area-inset-top))";

/**
 * Style for pinning a single header control (e.g. a back button) to the top of
 * the scroll area. The control's containing block must span the full scroll
 * height (i.e. it must be a direct child of the screen's root element).
 */
export const stickyControl: CSSProperties = { position: "sticky", top: stickyTop, zIndex: 30 };

/**
 * Pins a left/right-aligned cluster of header icons. The strip itself is
 * transparent and ignores pointer events; only the inner buttons are tappable,
 * so content scrolls freely beneath it.
 */
export function StickyBar({
  children, justify = "flex-end", pullUp = 40,
}: {
  children: ReactNode;
  justify?: "flex-start" | "flex-end" | "space-between";
  pullUp?: number;
}) {
  return (
    <div style={{ position: "sticky", top: stickyTop, zIndex: 30, display: "flex", justifyContent: justify, pointerEvents: "none", marginBottom: -pullUp }}>
      <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 9 }}>{children}</div>
    </div>
  );
}
