import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, GraduationCap, Building2 } from "lucide-react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { useOnboarding } from "../hooks/useOnboarding";
import type { OnboardingUserType } from "@/types/onboarding";

const OPTIONS = [
  {
    type: "student_housing" as OnboardingUserType,
    Icon: Home,
    gradient: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
    title: "Find housing",
    body: "I'm looking for a place to live",
  },
  {
    type: "student_flatmates" as OnboardingUserType,
    Icon: Users,
    gradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
    title: "Find flatmates",
    body: "I want to share with other students",
  },
  {
    type: "student_tools" as OnboardingUserType,
    Icon: GraduationCap,
    gradient: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
    title: "Use student tools",
    body: "Study Hub, buses, bills — I have housing sorted",
  },
  {
    type: "landlord" as OnboardingUserType,
    Icon: Building2,
    gradient: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)",
    title: "List my properties",
    body: "I'm a landlord with properties to rent out",
  },
] as const;

export function UserTypeSelection() {
  const navigate = useNavigate();
  const { setUserType } = useOnboarding();

  const select = (type: OnboardingUserType) => {
    setUserType(type);
    navigate(type === "landlord" ? "/onboarding/landlord" : "/onboarding/student");
  };

  return (
    <OnboardingLayout step={1} totalSteps={3}>
      <div className="flex flex-1 flex-col px-5 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-7"
        >
          <h2 className="text-[26px] font-semibold text-foreground">I'm here to…</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            This helps us personalise your experience
          </p>
        </motion.div>

        {/* Option cards */}
        <div className="space-y-3">
          {OPTIONS.map(({ type, Icon, gradient, title, body }, i) => (
            <motion.button
              key={type}
              type="button"
              onClick={() => select(type)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
              className="flex w-full items-center gap-4 rounded-[20px] bg-[var(--glass-fill)] border border-[var(--glass-border)] px-4 py-4 text-left backdrop-blur-md active:scale-[0.98] transition-transform hover:brightness-105"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{ background: gradient }}
              >
                <Icon size={22} strokeWidth={1.8} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{body}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
}
