import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Search } from "lucide-react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { useOnboarding } from "../hooks/useOnboarding";

const UNIVERSITIES = [
  "University of Cyprus",
  "Cyprus University of Technology",
  "University of Nicosia",
  "European University Cyprus",
  "UCLan Cyprus",
  "Frederick University",
  "Other / Not a student",
];

const CITIES = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Any city"];
const BUDGETS = ["€200 – €300", "€300 – €450", "€450 – €600", "€600+"];
const BEDROOMS = ["1 bedroom", "2 bedrooms", "3+ bedrooms"];
const RENTS = ["€200 – €300 /mo", "€300 – €450 /mo", "€450 – €600 /mo", "€600+ /mo"];

function FieldSelect({
  label, value, onChange, options, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-semibold text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-[14px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function StudentPersonalization() {
  const navigate = useNavigate();
  const { data, patchStudentPrefs } = useOnboarding();
  const isFlatmates = data.userType === "student_flatmates";

  // "hasPlace" fork — only for flatmates flow
  const [hasPlace, setHasPlace] = useState<boolean | null>(null);
  const showFork = isFlatmates && hasPlace === null;

  const [university, setUniversity] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [rentPerPerson, setRentPerPerson] = useState("");

  const saveAndContinue = () => {
    if (isFlatmates && hasPlace) {
      patchStudentPrefs({ university, city, hasPlace: true, bedroomsAvailable: bedrooms, rentPerPerson });
    } else {
      patchStudentPrefs({ university, city, budget, hasPlace: isFlatmates ? false : undefined });
    }
    navigate("/onboarding/complete");
  };

  const title =
    isFlatmates && hasPlace
      ? "About your place"
      : isFlatmates
      ? "What are you looking for?"
      : "Tell us about you";

  return (
    <OnboardingLayout step={2} totalSteps={3}>
      <div className="flex flex-1 flex-col px-5 py-8">

        {/* "Has place?" fork for flatmates */}
        <AnimatePresence mode="wait">
          {showFork ? (
            <motion.div
              key="fork"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.28 }}
            >
              <h2 className="mb-2 text-[26px] font-semibold text-foreground">Quick question</h2>
              <p className="mb-7 text-[14px] text-muted-foreground">
                Do you already have a place to live?
              </p>

              <div className="space-y-3">
                {[
                  { val: true,  icon: Check, grad: "linear-gradient(135deg,#34D399 0%,#059669 100%)", label: "Yes, I have a place", sub: "I need flatmates to share with" },
                  { val: false, icon: Search, grad: "linear-gradient(135deg,#60A5FA 0%,#2563EB 100%)", label: "No, I'm still looking", sub: "I want to find shared accommodation" },
                ].map(({ val, icon: Icon, grad, label, sub }) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setHasPlace(val)}
                    className="flex w-full items-center gap-4 rounded-[20px] bg-[var(--glass-fill)] border border-[var(--glass-border)] px-4 py-4 text-left backdrop-blur-md active:scale-[0.98] transition-transform hover:brightness-105"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                      style={{ background: grad }}>
                      <Icon size={22} strokeWidth={1.8} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">{label}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.28 }}
              className="flex flex-1 flex-col"
            >
              <h2 className="mb-6 text-[26px] font-semibold text-foreground">{title}</h2>

              <FieldSelect
                label="Which university?"
                value={university}
                onChange={setUniversity}
                options={UNIVERSITIES}
                placeholder="Select university"
              />

              <FieldSelect
                label={isFlatmates && hasPlace ? "Property location" : "Preferred city"}
                value={city}
                onChange={setCity}
                options={CITIES}
                placeholder="Select city"
              />

              {isFlatmates && hasPlace ? (
                <>
                  <FieldSelect
                    label="Bedrooms available"
                    value={bedrooms}
                    onChange={setBedrooms}
                    options={BEDROOMS}
                    placeholder="Select"
                  />
                  <FieldSelect
                    label="Rent per person (monthly)"
                    value={rentPerPerson}
                    onChange={setRentPerPerson}
                    options={RENTS}
                    placeholder="Select rent"
                  />
                  <div className="mb-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3 text-[13px] text-muted-foreground backdrop-blur-md">
                    💡 You can add photos and full details after setup
                  </div>
                </>
              ) : (
                <>
                  <FieldSelect
                    label={isFlatmates ? "Budget per person (monthly)" : "Monthly budget"}
                    value={budget}
                    onChange={setBudget}
                    options={BUDGETS}
                    placeholder="Select budget"
                  />
                  {isFlatmates && (
                    <div className="mb-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3 text-[13px] text-muted-foreground backdrop-blur-md">
                      💡 We'll show you students who have places and need flatmates
                    </div>
                  )}
                </>
              )}

              <div className="mt-auto pt-4">
                <button
                  type="button"
                  onClick={saveAndContinue}
                  className="w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground active:scale-[0.98] transition-transform"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/onboarding/complete")}
                  className="mt-3 w-full py-2 text-sm font-medium text-muted-foreground"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OnboardingLayout>
  );
}
