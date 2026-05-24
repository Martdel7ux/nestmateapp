import type { ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";

interface OnboardingLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
}

export function OnboardingLayout({ children, step, totalSteps = 3 }: OnboardingLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--bg-base)] [overflow-x:clip]">
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div
          className="absolute -left-[20%] -top-[10%] h-[48vh] w-[48vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-primary)" }}
        />
        <div
          className="absolute -right-[15%] top-[30%] h-[44vh] w-[44vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-secondary)" }}
        />
        <div
          className="absolute bottom-[5%] left-[5%] h-[36vh] w-[36vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-accent)" }}
        />
      </div>

      {/* Progress bar */}
      {step !== undefined && <ProgressBar current={step} total={totalSteps} />}

      {children}
    </div>
  );
}
