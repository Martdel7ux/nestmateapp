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
      {/* Themed base */}
      <div className="absolute inset-0 bg-[var(--bg-base)]" />

      {/* Primary glow — top-left (sky/primary) */}
      <div
        className="absolute -left-[15%] -top-[10%] h-[50vh] w-[50vh] rounded-full blur-[90px]"
        style={{ background: "var(--ambient-primary)" }}
      />
      {/* Secondary glow — top-right (amber/secondary) */}
      <div
        className="absolute -right-[10%] top-[5%] h-[40vh] w-[40vh] rounded-full blur-[90px]"
        style={{ background: "var(--ambient-secondary)" }}
      />
      {/* Accent glow — bottom-left (emerald) */}
      <div
        className="absolute bottom-[5%] left-[5%] h-[38vh] w-[38vh] rounded-full blur-[90px]"
        style={{ background: "var(--ambient-accent)" }}
      />

      {/* Grain texture */}
      <div
        className="bg-noise absolute inset-0"
        style={{ opacity: "var(--grain-opacity)" }}
      />
    </div>
  );
}
