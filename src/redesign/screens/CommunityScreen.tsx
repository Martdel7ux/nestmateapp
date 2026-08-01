import { useState } from "react";
import { useDiscoverGroups, useJoinStudyGroup } from "@/hooks/use-study-groups";
import { ModuleIcon } from "../icons";

type Seg = "societies" | "market" | "perks";
const SEGMENTS: { key: Seg; label: string }[] = [
  { key: "societies", label: "Societies" },
  { key: "market", label: "Marketplace" },
  { key: "perks", label: "Perks" },
];

function SocietiesBody() {
  const { data: groups, isLoading } = useDiscoverGroups();
  const join = useJoinStudyGroup();
  const list = groups ?? [];

  if (isLoading) return <div style={{ marginTop: 22, textAlign: "center", color: "var(--nm-muted)", fontSize: 13 }}>Loading…</div>;
  if (list.length === 0) {
    return (
      <div className="nm-card nm-card-lg" style={{ marginTop: 18, padding: 26, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <span className="nm-pill">No societies yet</span>
        <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>Communities, course groups and country societies will appear here.</p>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 11 }}>
      {list.map((g) => {
        const joined = g.member_role != null;
        return (
          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
            <span style={{ width: 38, height: 38, flex: "none", borderRadius: 13, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
              <ModuleIcon name="community" size={19} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{g.name}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(g.member_count ?? 0)} members{g.course?.title ? ` · ${g.course.title}` : ""}
              </span>
            </span>
            <button
              type="button"
              disabled={joined || join.isPending}
              onClick={() => !joined && join.mutate(g.id)}
              style={{ all: "unset", cursor: joined ? "default" : "pointer", padding: "7px 14px", borderRadius: 99, border: `1px solid ${joined ? "var(--nm-soft)" : "var(--nm-accent)"}`, color: joined ? "var(--nm-muted)" : "var(--nm-accent)", background: joined ? "var(--nm-soft)" : "transparent", font: "600 11.5px Inter, sans-serif" }}
            >
              {joined ? "Joined" : "Join"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const MARKET = [
  { price: "€45", name: "IKEA desk lamp", seller: "Maria · CUT" },
  { price: "€120", name: "Road bike, M frame", seller: "Kwame · UNIC" },
  { price: "€25", name: "Calc textbook bundle", seller: "Lena · UCY" },
  { price: "€60", name: "Mini fridge", seller: "Omar · Frederick" },
];

function MarketBody() {
  return (
    <>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
        {MARKET.map((m) => (
          <div key={m.name} className="nm-card" style={{ overflow: "hidden" }}>
            <div style={{ height: 96, background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)" }}>
              <ModuleIcon name="market" size={30} />
            </div>
            <div style={{ padding: "12px 13px 14px" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.price}</div>
              <div style={{ fontSize: 12.5, marginTop: 3 }}>{m.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--nm-muted)", marginTop: 5 }}>{m.seller}</div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" style={{ all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", textAlign: "center", marginTop: 18, padding: 16, borderRadius: "var(--nm-r-md)", border: "1px solid var(--nm-accent)", color: "var(--nm-accent)", font: "600 15px Inter, sans-serif" }}>
        List something
      </button>
      <p style={{ fontSize: 11.5, color: "var(--nm-muted)", marginTop: 12, textAlign: "center" }}>Preview · marketplace listings arrive with the next update.</p>
    </>
  );
}

const DEALS = [
  { name: "Bolt rides", note: "Weekday student fares", off: "-20%" },
  { name: "Coffee Island", note: "Any drink with student ID", off: "-15%" },
  { name: "Public gym Nicosia", note: "Monthly student pass", off: "-30%" },
  { name: "Cineplex", note: "Tuesday screenings", off: "-25%" },
];

function PerksBody() {
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 11 }}>
      {DEALS.map((d) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 13, background: "var(--nm-coral-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-coral)" }}>
            <ModuleIcon name="deals" size={20} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{d.name}</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2 }}>{d.note}</span>
          </span>
          <span style={{ font: "600 14px Inter, sans-serif", color: "var(--nm-coral)" }}>{d.off}</span>
        </div>
      ))}
      <p style={{ fontSize: 11.5, color: "var(--nm-muted)", marginTop: 6, textAlign: "center" }}>Preview · unlocked by verified student status.</p>
    </div>
  );
}

export function CommunityScreen() {
  const [seg, setSeg] = useState<Seg>("societies");

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Community</div>
      <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 8 }}>Societies, marketplace and perks — your people on campus.</div>

      {/* Segmented control */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        {SEGMENTS.map((s) => {
          const on = seg === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSeg(s.key)}
              style={{ all: "unset", cursor: "pointer", padding: "8px 14px", borderRadius: 99, font: "600 12.5px Inter, sans-serif", background: on ? "var(--nm-accent)" : "var(--nm-surface2)", color: on ? "#fff" : "var(--nm-muted)" }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {seg === "societies" && <SocietiesBody />}
      {seg === "market" && <MarketBody />}
      {seg === "perks" && <PerksBody />}

      <div style={{ height: 12 }} />
    </div>
  );
}
