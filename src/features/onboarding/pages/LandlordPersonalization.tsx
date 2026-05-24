import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { useOnboarding } from "../hooks/useOnboarding";

const PROPERTY_COUNTS = ["1 property", "2 properties", "3–5 properties", "6–10 properties", "10+ properties"];
const LOCATIONS = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Multiple cities", "Other"];

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

const PRO_COUNTS = new Set(["3–5 properties", "6–10 properties", "10+ properties"]);

export function LandlordPersonalization() {
  const navigate = useNavigate();
  const { patchLandlordPrefs } = useOnboarding();

  const [propertyCount, setPropertyCount] = useState("");
  const [location, setLocation] = useState("");

  const showPro = PRO_COUNTS.has(propertyCount);

  const saveAndContinue = () => {
    patchLandlordPrefs({ propertyCount, location });
    navigate("/onboarding/complete");
  };

  return (
    <OnboardingLayout step={2} totalSteps={3}>
      <div className="flex flex-1 flex-col px-5 py-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28 }}
          className="flex flex-1 flex-col"
        >
          <h2 className="mb-2 text-[26px] font-semibold text-foreground">About your properties</h2>
          <p className="mb-6 text-[14px] text-muted-foreground">
            Help us tailor your listing experience
          </p>

          <FieldSelect
            label="How many properties do you manage?"
            value={propertyCount}
            onChange={setPropertyCount}
            options={PROPERTY_COUNTS}
            placeholder="Select number"
          />

          <FieldSelect
            label="Primary location"
            value={location}
            onChange={setLocation}
            options={LOCATIONS}
            placeholder="Select city"
          />

          {showPro && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-6 flex items-start gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3 backdrop-blur-md"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg,#FB923C 0%,#EA580C 100%)" }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">You qualify for NestMate Pro</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Bulk listing tools, priority placement and analytics — we'll reach out after setup.
                </p>
              </div>
            </motion.div>
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
      </div>
    </OnboardingLayout>
  );
}
