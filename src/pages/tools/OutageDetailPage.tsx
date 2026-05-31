import { useParams } from "react-router-dom";
import { Zap, MapPin, Clock, AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useOutage } from "@/hooks/use-tools";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(starts: string, ends: string): string {
  const mins = Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60_000);
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h !== 1 ? "s" : ""}`;
}

export function OutageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t }  = useI18n();
  const { data: outage, isLoading } = useOutage(id);

  if (isLoading || !outage) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Outage Details" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const now     = new Date();
  const starts  = new Date(outage.starts_at);
  const ends    = new Date(outage.ends_at);
  const ongoing = starts <= now && now <= ends;
  const future  = starts > now;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Outage Details" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        {/* Status banner */}
        <div className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3",
          ongoing ? "bg-rose-50 dark:bg-rose-900/20" : "bg-amber-50 dark:bg-amber-900/20"
        )}>
          {ongoing
            ? <AlertTriangle size={18} className="text-rose-500 shrink-0" />
            : <Zap size={18} className="text-amber-500 shrink-0" />
          }
          <div>
            <p className={cn("text-sm font-bold", ongoing ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400")}>
              {ongoing ? t("outageOngoing") : future ? t("outageScheduled") : t("outageCompleted")}
            </p>
            {ongoing && (
              <p className="text-xs text-muted-foreground">
                Expected to end at {new Date(outage.ends_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {/* Details card */}
        <div className="rounded-2xl border border-border bg-background/60 divide-y divide-border">
          {outage.area && (
            <div className="flex items-center gap-3 px-4 py-3">
              <MapPin size={15} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("outageArea")}</p>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {outage.area}{outage.district ? `, ${outage.district.charAt(0).toUpperCase() + outage.district.slice(1)}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            <Clock size={15} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("outageStart")}</p>
              <p className="text-sm font-semibold text-foreground">{formatDateTime(outage.starts_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <Clock size={15} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("outageEnd")}</p>
              <p className="text-sm font-semibold text-foreground">
                {formatDateTime(outage.ends_at)} · {formatDuration(outage.starts_at, outage.ends_at)}
              </p>
            </div>
          </div>

          {outage.reason && (
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{t("outageReason")}</p>
              <p className="text-sm text-foreground">{outage.reason}</p>
            </div>
          )}
        </div>

        {/* Affected streets */}
        {outage.streets.length > 0 && (
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("outageStreets")}</p>
            <div className="flex flex-wrap gap-1.5">
              {outage.streets.map((street, i) => (
                <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {street}
                </span>
              ))}
            </div>
          </div>
        )}

        {outage.source_url && (
          <a href={outage.source_url} target="_blank" rel="noreferrer"
            className="block text-center text-xs text-primary font-semibold py-2">
            {t("outageViewEAC")}
          </a>
        )}
      </div>
    </div>
  );
}
