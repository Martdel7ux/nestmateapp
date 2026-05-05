import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export function GdprGate() {
  const { profile, updateConsent } = useAuth();

  if (!profile) return null;

  const accepted =
    profile.accepted_terms_at && profile.accepted_privacy_at && profile.accepted_cookies_at;

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-lg">
      <Card className="max-w-lg space-y-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <ShieldCheck size={28} />
        </div>
        <div className="space-y-2">
          <CardTitle>Before you continue</CardTitle>
          <CardDescription>
            NestMate requires consent for the Terms, Privacy Policy, and Cookie Policy before
            any housing or matching data is shown.
          </CardDescription>
        </div>
        <div className="rounded-3xl bg-muted/70 p-4 text-sm text-muted-foreground">
          By continuing, you confirm that you accept all three policies and consent to
          account and matching data processing under GDPR.
        </div>
        <Button onClick={() => updateConsent(true)} className="w-full">
          Accept all policies
        </Button>
      </Card>
    </div>
  );
}
