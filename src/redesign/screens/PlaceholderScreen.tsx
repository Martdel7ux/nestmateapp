export function PlaceholderScreen({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div
      style={{
        padding: "calc(20px + env(safe-area-inset-top)) 20px 20px",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        animation: "nmFade .35s ease-out",
      }}
    >
      <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</div>
      <div
        className="nm-card nm-card-lg"
        style={{
          marginTop: 24,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 10,
        }}
      >
        <span className="nm-pill">Coming next</span>
        <p style={{ fontSize: 14, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 280 }}>{blurb}</p>
      </div>
    </div>
  );
}
