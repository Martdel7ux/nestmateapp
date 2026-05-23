import { Briefcase, Building2, Calendar, Globe, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SaveButton } from "./save-button";
import type { Opportunity, OpportunityType } from "@/types/discover";

const typeConfig: Record<
  OpportunityType,
  { label: string; color: string; Icon: typeof Calendar }
> = {
  event: { label: "Event", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", Icon: Calendar },
  job: { label: "Job", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", Icon: Briefcase },
  internship: { label: "Internship", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", Icon: Building2 },
  volunteering: { label: "Volunteering", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", Icon: Users },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function salaryLabel(opp: Opportunity) {
  if (!opp.salary_min && !opp.salary_max) return null;
  const cur = opp.salary_currency ?? "EUR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
  if (opp.salary_min && opp.salary_max) return `${fmt(opp.salary_min)} – ${fmt(opp.salary_max)}`;
  if (opp.salary_min) return `From ${fmt(opp.salary_min)}`;
  return `Up to ${fmt(opp.salary_max!)}`;
}

export function OpportunityCard({ opportunity: opp }: { opportunity: Opportunity }) {
  const { label, color, Icon } = typeConfig[opp.type];
  const salary = salaryLabel(opp);

  return (
    <Link
      to={`/discover/${opp.id}`}
      className="block rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
    >
      {opp.image_url && (
        <div className="h-36 overflow-hidden bg-muted">
          <img src={opp.image_url} alt={opp.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", color)}>
            <Icon size={11} />
            {label}
          </span>
          <SaveButton opportunity={opp} />
        </div>

        <h3 className="mt-2 font-semibold text-foreground leading-snug line-clamp-2">{opp.title}</h3>

        {opp.organization && (
          <p className="mt-0.5 text-sm text-muted-foreground font-medium">{opp.organization}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {opp.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {opp.location}
            </span>
          )}
          {opp.location_type && opp.location_type !== "in_person" && (
            <span className="flex items-center gap-1">
              <Globe size={11} /> {opp.location_type === "remote" ? "Remote" : "Hybrid"}
            </span>
          )}
          {opp.starts_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {formatDate(opp.starts_at)}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              {salary}
            </span>
          )}
        </div>

        {opp.tags && opp.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {opp.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
