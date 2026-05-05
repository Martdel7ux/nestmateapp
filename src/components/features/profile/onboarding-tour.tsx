import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Search smarter",
    body: "Use the AI search bar to describe what you want in plain language, then switch between map and grid."
  },
  {
    title: "Match intentionally",
    body: "Create your flatmate card, swipe only on compatible housing setups, and chat instantly after a mutual match."
  },
  {
    title: "Stay in control",
    body: "Save listings, manage notifications, and keep your profile, preferences, and consents current."
  }
];

export function OnboardingTour() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const seen = window.localStorage.getItem("nestmate-tour-seen");
    if (!seen) setStep(0);
  }, []);

  if (step === null) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2">
      <Card className="space-y-4 border-primary/20">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Quick tour
          </p>
          <CardTitle>{current.title}</CardTitle>
          <CardDescription>{current.body}</CardDescription>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {step + 1} / {steps.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.localStorage.setItem("nestmate-tour-seen", "true");
                setStep(null);
              }}
            >
              Skip
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (isLast) {
                  window.localStorage.setItem("nestmate-tour-seen", "true");
                  setStep(null);
                  return;
                }
                setStep((currentStep) => (currentStep === null ? null : currentStep + 1));
              }}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
