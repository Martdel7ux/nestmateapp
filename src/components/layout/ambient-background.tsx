import { cn } from "@/lib/utils";

/**
 * Full-screen ambient background: themed base color, brand-tinted glow blobs,
 * and a subtle grain overlay. Renders behind everything via fixed -z-10.
 *
 * Usage: place once inside a page wrapper that fills the viewport.
 * The home page uses its own variant (forced-dark); other pages use this.
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      {/* Brand glows rendered as static radial gradients instead of blurred
          circles. `filter: blur()` on large elements is one of the most
          expensive things a mobile GPU does and delays first paint on page
          navigation; radial gradients look nearly identical and composite
          instantly. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60vh 60vh at 12% 6%, var(--ambient-primary), transparent 60%)," +
            "radial-gradient(52vh 52vh at 92% 12%, var(--ambient-secondary), transparent 60%)," +
            "radial-gradient(48vh 48vh at 8% 92%, var(--ambient-accent), transparent 60%)," +
            "var(--bg-base)",
        }}
      />

      {/* Grain texture */}
      <div
        className="bg-noise absolute inset-0"
        style={{ opacity: "var(--grain-opacity)" }}
      />
    </div>
  );
}
