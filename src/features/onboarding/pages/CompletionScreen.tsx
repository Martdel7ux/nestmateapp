import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { useOnboarding } from "../hooks/useOnboarding";

const DESTINATION: Record<string, string> = {
  student_housing: "/",
  student_flatmates: "/flatmates",
  student_tools: "/tools",
  landlord: "/",
};

const CTA_LABEL: Record<string, string> = {
  student_housing: "Browse properties",
  student_flatmates: "Find flatmates",
  student_tools: "Explore tools",
  landlord: "List a property",
};

const SUBTITLE: Record<string, string> = {
  student_housing: "We'll surface properties that match your preferences.",
  student_flatmates: "Your profile is ready — start connecting with students.",
  student_tools: "Head to the tools hub and explore everything NestMate offers.",
  landlord: "Your landlord dashboard is ready. Start listing your properties.",
};

export function CompletionScreen() {
  const navigate = useNavigate();
  const { data, completeOnboarding } = useOnboarding();

  useEffect(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const userType = data.userType ?? "student_housing";
  const dest = DESTINATION[userType] ?? "/";
  const cta = CTA_LABEL[userType] ?? "Get started";
  const subtitle = SUBTITLE[userType] ?? "You're all set!";

  return (
    <OnboardingLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
          className="mb-8"
        >
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[28px] shadow-lg"
            style={{ background: "linear-gradient(135deg,#34D399 0%,#059669 100%)" }}
          >
            <Check size={44} strokeWidth={2.2} className="text-white" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-3 text-[26px] font-semibold text-foreground"
        >
          You're all set!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
          className="max-w-[280px] text-[15px] leading-relaxed text-muted-foreground"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.4 }}
          className="mt-12 w-full"
        >
          <button
            type="button"
            onClick={() => navigate(dest, { replace: true })}
            className="w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground active:scale-[0.98] transition-transform"
          >
            {cta}
          </button>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
}
