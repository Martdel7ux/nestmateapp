import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Users, GraduationCap, ChevronRight } from "lucide-react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { SlideIndicators } from "../components/SlideIndicators";

const SLIDES = [
  {
    Icon: Home,
    gradient: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
    title: "Find your place",
    body: "Browse 200+ verified properties across Cyprus. Connect directly with landlords.",
  },
  {
    Icon: Users,
    gradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
    title: "Connect with flatmates",
    body: "Find students to share with. Build your household and split costs fairly.",
  },
  {
    Icon: GraduationCap,
    gradient: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
    title: "Student essentials",
    body: "Study Hub, bus routes, bill calculators and AI assistant — all in one place.",
  },
] as const;

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export function IntroSlides() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next: number) => {
    setDir(next > idx ? 1 : -1);
    setIdx(next);
  };

  const advance = () => {
    if (idx < SLIDES.length - 1) {
      go(idx + 1);
    } else {
      navigate("/onboarding/user-type");
    }
  };

  const { Icon, gradient, title, body } = SLIDES[idx];

  return (
    <OnboardingLayout>
      <div className="flex flex-1 flex-col">
        {/* Slide content */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center"
            >
              {/* Icon circle */}
              <div
                className="mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] shadow-lg"
                style={{ background: gradient }}
              >
                <Icon size={40} strokeWidth={1.6} className="text-white" />
              </div>

              <h2 className="mb-3 text-[26px] font-semibold leading-tight text-foreground">
                {title}
              </h2>
              <p className="max-w-[280px] text-[15px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="px-6 pb-12">
          <SlideIndicators total={SLIDES.length} current={idx} />

          <button
            type="button"
            onClick={advance}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground active:scale-[0.98] transition-transform"
          >
            {idx < SLIDES.length - 1 ? "Next" : "Get started"}
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/onboarding/user-type")}
            className="mt-3 w-full py-2 text-sm font-medium text-muted-foreground"
          >
            Skip
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
