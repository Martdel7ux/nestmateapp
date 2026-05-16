import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { SaveButton } from "@/components/features/discover/save-button";
import { ShareButton } from "@/components/features/discover/share-button";
import { useOpportunity } from "@/hooks/use-opportunity";
import type { OpportunityType } from "@/types/discover";

const typeConfig: Record<OpportunityType, { label: string; Icon: typeof Calendar }> = {
  event: { label: "Event", Icon: Calendar },
  job: { label: "Job", Icon: Briefcase },
  internship: { label: "Internship", Icon: Building2 },
  volunteering: { label: "Volunteering", Icon: Users },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function salaryLabel(min?: number | null, max?: number | null, currency = "EUR") {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: opp, isLoading } = useOpportunity(id ?? "");

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="h-56 bg-muted animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
        <p className="font-semibold">Opportunity not found</p>
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-primary">
          Go back
        </button>
      </div>
    );
  }

  const { label, Icon } = typeConfig[opp.type];
  const salary = salaryLabel(opp.salary_min, opp.salary_max, opp.salary_currency ?? "EUR");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Hero image or colour block */}
        <div className="relative">
          {opp.image_url ? (
            <img
              src={opp.image_url}
              alt={opp.title}
              className="h-52 w-full object-cover"
            />
          ) : (
            <div className="h-32 bg-gradient-to-br from-primary/30 to-sky-400/30" />
          )}

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Actions */}
          <div className="absolute right-4 top-4 flex gap-2">
            <ShareButton opportunity={opp} />
            <SaveButton opportunity={opp} />
          </div>
        </div>

        {/* Content */}
        <div className="rounded-t-3xl bg-background -mt-4 relative px-5 pb-32 pt-5">
          {/* Type badge */}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Icon size={12} /> {label}
          </span>

          <h1 className="mt-3 text-2xl font-bold leading-tight">{opp.title}</h1>

          {opp.organization && (
            <p className="mt-1 text-base font-medium text-muted-foreground">{opp.organization}</p>
          )}

          {/* Meta grid */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {opp.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="shrink-0 text-primary" />
                <span className="truncate">{opp.location}</span>
              </div>
            )}
            {opp.location_type && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe size={14} className="shrink-0 text-primary" />
                <span className="capitalize">{opp.location_type.replace("_", " ")}</span>
              </div>
            )}
            {opp.employment_type && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase size={14} className="shrink-0 text-primary" />
                <span className="capitalize">{opp.employment_type.replace("_", " ")}</span>
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <span>{salary}</span>
              </div>
            )}
            {opp.starts_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={14} className="shrink-0 text-primary" />
                <span>{formatDateTime(opp.starts_at)}</span>
              </div>
            )}
            {opp.ends_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} className="shrink-0 text-primary" />
                <span>Until {formatDateTime(opp.ends_at)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {opp.tags && opp.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opp.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {opp.description && (
            <div className="mt-5">
              <h2 className="mb-2 font-semibold">About this opportunity</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {opp.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      {opp.url && (
        <div className="shrink-0 border-t border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <a
            href={opp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Apply / View Details
            <ExternalLink size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
