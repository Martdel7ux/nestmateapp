import { IconArrowLeft, IconHeart, IconClose } from "../icons";
import { initialsOf } from "../util";
import type { MatchResult } from "@/lib/match-score";
import {
  CLEANLINESS_OPTIONS, SLEEP_OPTIONS, SOCIAL_OPTIONS, STUDY_OPTIONS, lifestyleOption,
  type LifestyleOption,
} from "@/lib/flatmate-lifestyle";
import type { FlatmateListing } from "@/types/supabase";

function barColor(score: number): string {
  if (score >= 85) return "var(--nm-mint)";
  if (score >= 70) return "var(--nm-accent)";
  if (score >= 50) return "#F59E0B";
  return "var(--nm-coral)";
}

export function RoommateDetail({
  flatmate, match, onBack, onSwipe,
}: {
  flatmate: FlatmateListing;
  match: MatchResult | null;
  onBack: () => void;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const name = flatmate.profile?.full_name ?? "Student";
  const hasFlat = flatmate.housing_status === "has_flat";
  const images = [
    ...(hasFlat ? (flatmate.apartment_images ?? []) : []),
    flatmate.profile_image_url ?? flatmate.profile?.avatar_url ?? null,
    ...(hasFlat ? [] : (flatmate.apartment_images ?? [])),
  ].filter(Boolean) as string[];

  const budget = hasFlat && flatmate.flat_price
    ? `€${flatmate.flat_price}/mo`
    : flatmate.min_budget && flatmate.max_budget ? `€${flatmate.min_budget}–${flatmate.max_budget}` : null;

  const chips = [
    lifestyleOption(CLEANLINESS_OPTIONS, flatmate.cleanliness),
    lifestyleOption(SLEEP_OPTIONS, flatmate.sleep_schedule),
    lifestyleOption(SOCIAL_OPTIONS, flatmate.social_habits),
    lifestyleOption(STUDY_OPTIONS, flatmate.study_habits),
  ].filter(Boolean) as LifestyleOption<string>[];

  const tags = [
    flatmate.country_of_origin,
    flatmate.language,
    flatmate.student_type === "erasmus" ? "Erasmus" : "Full-time",
    hasFlat ? "Has a place" : "Looking for a place",
  ].filter(Boolean) as string[];

  return (
    <div style={{ paddingBottom: 96, animation: "nmFade .3s ease-out" }}>
      <button type="button" onClick={onBack} aria-label="Back" className="nm-icon-btn nm-press" style={{ marginBottom: 14 }}>
        <IconArrowLeft />
      </button>

      {/* Gallery */}
      <div className="nm-card" style={{ overflow: "hidden" }}>
        {images.length > 0 ? (
          <div className="nm-hscroll" style={{ gap: 0 }}>
            {images.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: images.length > 1 ? "88%" : "100%", height: 300, objectFit: "cover", flex: "none", scrollSnapAlign: "start" }} />
            ))}
          </div>
        ) : (
          <div style={{ height: 300, background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)", font: "600 48px Inter, sans-serif" }}>{initialsOf(name)}</div>
        )}
      </div>

      {/* Header */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>{name}</div>
          <div style={{ fontSize: 13, color: "var(--nm-muted)", marginTop: 3 }}>{[flatmate.preferred_city, budget].filter(Boolean).join(" · ")}</div>
        </div>
        {match && match.dimensions.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: barColor(match.overall), lineHeight: 1 }}>{match.overall}%</div>
            <div style={{ fontSize: 11, color: "var(--nm-muted)", marginTop: 2 }}>match</div>
          </div>
        )}
      </div>

      {/* Match breakdown */}
      {match && match.dimensions.length > 0 && (
        <div className="nm-card nm-card-lg" style={{ marginTop: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Compatibility</div>
          {match.dimensions.map((d) => (
            <div key={d.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{d.label}</span>
                <span style={{ color: "var(--nm-muted)" }}>{d.score}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "var(--nm-surface2)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${d.score}%`, background: barColor(d.score) }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lifestyle chips */}
      {chips.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="nm-section-label" style={{ marginBottom: 8 }}>Lifestyle</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {chips.map(({ value, label, icon: Icon }) => (
              <span key={value} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "var(--nm-soft)", color: "var(--nm-accent)", font: "600 12px Inter, sans-serif" }}>
                <Icon size={13} />{label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {flatmate.bio && (
        <p style={{ marginTop: 16, fontSize: 14, color: "var(--nm-text)", lineHeight: 1.55 }}>{flatmate.bio}</p>
      )}

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {tags.map((t) => (
          <span key={t} style={{ padding: "6px 12px", borderRadius: 99, background: "var(--nm-surface2)", color: "var(--nm-muted)", font: "500 12px Inter, sans-serif" }}>{t}</span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 22 }}>
        <button type="button" onClick={() => onSwipe("left")} aria-label="Pass" className="nm-press" style={{ all: "unset", cursor: "pointer", width: 60, height: 60, borderRadius: 99, background: "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: "var(--nm-coral)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconClose size={26} />
        </button>
        <button type="button" onClick={() => onSwipe("right")} aria-label="Like" className="nm-press" style={{ all: "unset", cursor: "pointer", width: 60, height: 60, borderRadius: 99, background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconHeart size={26} />
        </button>
      </div>
    </div>
  );
}
