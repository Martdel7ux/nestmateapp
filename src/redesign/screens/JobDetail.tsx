import { IconArrowLeft, IconHeart } from "../icons";
import { useToggleSave } from "@/hooks/use-saved-opportunities";
import type { Opportunity, OppEmploymentType } from "@/types/discover";

const EMPLOYMENT_LABEL: Record<OppEmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  volunteer: "Volunteer",
};

const LOCATION_LABEL: Record<string, string> = {
  in_person: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export function salaryLabel(o: Opportunity): string | null {
  const cur = o.salary_currency ?? "€";
  const sym = cur === "EUR" ? "€" : cur === "USD" ? "$" : cur === "GBP" ? "£" : cur;
  if (o.salary_min && o.salary_max) return `${sym}${o.salary_min.toLocaleString()}–${o.salary_max.toLocaleString()}`;
  if (o.salary_min) return `From ${sym}${o.salary_min.toLocaleString()}`;
  if (o.salary_max) return `Up to ${sym}${o.salary_max.toLocaleString()}`;
  return null;
}

export function JobDetail({ job, onBack }: { job: Opportunity; onBack: () => void }) {
  const saved = !!job.is_saved;
  const toggle = useToggleSave(job.id, saved);

  const org = job.organization ?? "—";
  const salary = salaryLabel(job);
  const facts = [
    job.location ?? (job.location_type ? LOCATION_LABEL[job.location_type] : null),
    job.location_type && job.location ? LOCATION_LABEL[job.location_type] : null,
    job.employment_type ? EMPLOYMENT_LABEL[job.employment_type] : null,
    salary,
  ].filter(Boolean) as string[];

  return (
    <div style={{ paddingBottom: 96, animation: "nmFade .3s ease-out" }}>
      <button type="button" onClick={onBack} aria-label="Back" className="nm-icon-btn nm-press" style={{ marginBottom: 14 }}>
        <IconArrowLeft />
      </button>

      {/* Banner */}
      <div className="nm-card" style={{ overflow: "hidden" }}>
        {job.image_url ? (
          <img src={job.image_url} alt="" style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ height: 130, background: "linear-gradient(120deg, var(--nm-soft), var(--nm-surface2))", display: "flex", alignItems: "center", justifyContent: "center", font: "700 40px Inter, sans-serif", color: "var(--nm-accent)" }}>
            {org.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2 }}>{job.title}</div>
        <div style={{ fontSize: 14, color: "var(--nm-muted)", marginTop: 6 }}>{org}</div>
      </div>

      {/* Facts */}
      {facts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {facts.map((f, i) => (
            <span key={i} style={{ padding: "7px 12px", borderRadius: 99, background: i === facts.length - 1 && salary ? "var(--nm-mint-soft)" : "var(--nm-surface2)", color: i === facts.length - 1 && salary ? "#0b7a5a" : "var(--nm-muted)", font: "600 12px Inter, sans-serif" }}>{f}</span>
          ))}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <p style={{ marginTop: 18, fontSize: 14, color: "var(--nm-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.description}</p>
      )}

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="nm-section-label" style={{ marginBottom: 8 }}>Skills & tags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {job.tags.map((t) => (
              <span key={t} className="nm-pill">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          className="nm-press"
          aria-label={saved ? "Unsave" : "Save"}
          style={{ all: "unset", cursor: "pointer", flex: "none", width: 54, height: 54, borderRadius: "var(--nm-r-md)", background: "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: saved ? "var(--nm-coral)" : "var(--nm-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconHeart size={22} />
        </button>
        {job.url || job.source_url ? (
          <a
            href={(job.url ?? job.source_url)!}
            target="_blank"
            rel="noopener noreferrer"
            className="nm-press"
            style={{ flex: 1, textDecoration: "none", height: 54, boxSizing: "border-box", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 15px Inter, sans-serif" }}
          >
            Apply now
          </a>
        ) : (
          <div style={{ flex: 1, height: 54, boxSizing: "border-box", borderRadius: "var(--nm-r-md)", background: "var(--nm-surface2)", color: "var(--nm-muted)", display: "flex", alignItems: "center", justifyContent: "center", font: "500 13.5px Inter, sans-serif" }}>
            No application link
          </div>
        )}
      </div>
    </div>
  );
}
