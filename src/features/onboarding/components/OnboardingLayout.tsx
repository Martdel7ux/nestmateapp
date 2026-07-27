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
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58vh 58vh at 8% 4%, var(--ambient-primary), transparent 60%)," +
              "radial-gradient(54vh 54vh at 92% 30%, var(--ambient-secondary), transparent 60%)," +
              "radial-gradient(46vh 46vh at 8% 92%, var(--ambient-accent), transparent 60%)," +
              "var(--bg-base)",
          }}
        />
      </div>

      {/* Progress bar */}
      {step !== undefined && <ProgressBar current={step} total={totalSteps} />}

      {children}
    </div>
  );
}
