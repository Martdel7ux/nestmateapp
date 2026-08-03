/** Dual-thumb range slider built from two overlaid <input type="range">. */
export function RangeSlider({
  minVal, maxVal, floor, ceil, step, onChange, format,
}: {
  minVal: number;
  maxVal: number;
  floor: number;
  ceil: number;
  step: number;
  onChange: (min: number, max: number) => void;
  format?: (v: number) => string;
}) {
  const pct = (v: number) => ((v - floor) / (ceil - floor)) * 100;
  const fmt = format ?? ((v) => String(v));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
        <span style={{ fontWeight: 600 }}>{fmt(minVal)}</span>
        <span style={{ fontWeight: 600 }}>{maxVal >= ceil ? `${fmt(ceil)}+` : fmt(maxVal)}</span>
      </div>
      <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 5, borderRadius: 99, background: "var(--nm-surface2)" }} />
        <div style={{ position: "absolute", height: 5, borderRadius: 99, background: "var(--nm-accent)", left: `${pct(minVal)}%`, right: `${100 - pct(maxVal)}%` }} />
        <input className="nm-range" type="range" min={floor} max={ceil} step={step} value={minVal} onChange={(e) => onChange(Math.min(Number(e.target.value), maxVal - step), maxVal)} />
        <input className="nm-range" type="range" min={floor} max={ceil} step={step} value={maxVal} onChange={(e) => onChange(minVal, Math.max(Number(e.target.value), minVal + step))} />
      </div>
    </div>
  );
}
