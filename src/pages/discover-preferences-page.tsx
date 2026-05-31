import { AppHeader } from "@/components/layout/app-header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDiscoverPreferences,
  useUpdateDiscoverPreferences,
} from "@/hooks/use-discover-preferences";
import { useI18n } from "@/contexts/i18n-context";
import type { OppNotifyFrequency, OpportunityType } from "@/types/discover";

export function DiscoverPreferencesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: prefs, isLoading } = useDiscoverPreferences();
  const { mutate, isPending } = useUpdateDiscoverPreferences();

  const TYPE_OPTIONS: { value: OpportunityType; label: string }[] = [
    { value: "event", label: t("preferencesEvents") },
    { value: "job", label: t("preferencesJobs") },
    { value: "internship", label: t("preferencesInternships") },
    { value: "volunteering", label: t("preferencesVolunteering") },
  ];

  const FREQ_OPTIONS: { value: OppNotifyFrequency; label: string }[] = [
    { value: "instant", label: t("preferencesInstantly") },
    { value: "daily", label: t("preferencesDaily") },
    { value: "weekly", label: t("preferencesWeekly") },
  ];

  const [types, setTypes] = useState<OpportunityType[]>([
    "event",
    "job",
    "internship",
    "volunteering",
  ]);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [frequency, setFrequency] = useState<OppNotifyFrequency>("daily");
  const [remoteOk, setRemoteOk] = useState(true);

  useEffect(() => {
    if (!prefs) return;
    setTypes((prefs.interested_types as OpportunityType[]) ?? types);
    setNotifyEmail(prefs.notify_email);
    setNotifyInApp(prefs.notify_inapp);
    setFrequency(prefs.notify_frequency);
    setRemoteOk(prefs.remote_ok);
  }, [prefs]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleType = (t: OpportunityType) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSave = () => {
    mutate(
      {
        interested_types: types,
        notify_email: notifyEmail,
        notify_inapp: notifyInApp,
        notify_frequency: frequency,
        remote_ok: remoteOk,
      },
      {
        onSuccess: () => {
          toast.success(t("preferencesSaved"));
          navigate(-1);
        },
        onError: () => toast.error(t("preferencesError")),
      }
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={t("preferencesTitle")} right={{ type: "none" }} />

      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="p-5 space-y-6 pb-32">
            {/* Interested types */}
            <section>
              <h2 className="mb-3 font-semibold">{t("preferencesInterestedIn")}</h2>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                      types.includes(value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Remote OK */}
            <section className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{t("preferencesRemote")}</p>
                <p className="text-sm text-muted-foreground">{t("preferencesRemoteDesc")}</p>
              </div>
              <button
                type="button"
                onClick={() => setRemoteOk(!remoteOk)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  remoteOk ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
                    remoteOk ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </section>

            {/* Notifications */}
            <section>
              <h2 className="mb-3 font-semibold">{t("preferencesNotifications")}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">{t("preferencesEmail")}</p>
                  <button
                    type="button"
                    onClick={() => setNotifyEmail(!notifyEmail)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      notifyEmail ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
                        notifyEmail ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">{t("preferencesInApp")}</p>
                  <button
                    type="button"
                    onClick={() => setNotifyInApp(!notifyInApp)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      notifyInApp ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
                        notifyInApp ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Frequency */}
            <section>
              <h2 className="mb-3 font-semibold">{t("preferencesFrequency")}</h2>
              <div className="space-y-2">
                {FREQ_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFrequency(value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                      frequency === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground"
                    )}
                  >
                    {label}
                    {frequency === value && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="shrink-0 border-t border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {isPending ? t("preferencesSaving") : t("preferencesSave")}
        </button>
      </div>
    </div>
  );
}
