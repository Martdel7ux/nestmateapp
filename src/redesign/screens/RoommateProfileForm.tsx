import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { initialsOf } from "../util";
import { cities } from "@/lib/constants";
import {
  CLEANLINESS_OPTIONS, SLEEP_OPTIONS, SOCIAL_OPTIONS, STUDY_OPTIONS, LIFESTYLE_DEFAULTS,
  type Cleanliness, type SleepSchedule, type SocialHabits, type StudyHabits,
} from "@/lib/flatmate-lifestyle";
import type { City, StudentType } from "@/types/supabase";
import { ModuleIcon } from "../icons";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "13px 15px", borderRadius: "var(--nm-r-md)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", boxShadow: "var(--nm-elev)",
  fontSize: 16, color: "var(--nm-text)",
};
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--nm-muted)", marginBottom: 6, display: "block" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/** Shown in the Roommates section when the user has no flatmate listing yet.
 *  Creating one unlocks browsing/swiping (the data layer gates it). */
export function RoommateProfileForm() {
  const { createFlatmateListing } = useData();
  const { profile } = useAuth();

  const [flatPreviews, setFlatPreviews] = useState<string[]>([]);
  const [flatFiles, setFlatFiles] = useState<File[]>([]);
  const flatInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [studentType, setStudentType] = useState<StudentType>("full_time");
  const [hasFlat, setHasFlat] = useState(false);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [preferredCity, setPreferredCity] = useState<City>("Nicosia");
  const [flatPrice, setFlatPrice] = useState("");
  const [flatArea, setFlatArea] = useState("");
  const [flatPostalCode, setFlatPostalCode] = useState("");
  const [cleanliness, setCleanliness] = useState<Cleanliness>(LIFESTYLE_DEFAULTS.cleanliness);
  const [sleep, setSleep] = useState<SleepSchedule>(LIFESTYLE_DEFAULTS.sleep_schedule);
  const [social, setSocial] = useState<SocialHabits>(LIFESTYLE_DEFAULTS.social_habits);
  const [study, setStudy] = useState<StudyHabits>(LIFESTYLE_DEFAULTS.study_habits);
  const [busy, setBusy] = useState(false);

  const onFlatImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setFlatPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    setFlatFiles((p) => [...p, ...files]);
  };
  const removeFlatImage = (i: number) => {
    setFlatPreviews((p) => p.filter((_, j) => j !== i));
    setFlatFiles((p) => p.filter((_, j) => j !== i));
  };

  const submit = async () => {
    if (bio.trim().length < 12) { toast.error("Write at least 12 characters about yourself."); return; }
    if (!country.trim()) { toast.error("Add your country of origin."); return; }
    if (!language.trim()) { toast.error("Add your primary language."); return; }
    if (!hasFlat && (!minBudget || !maxBudget)) { toast.error("Add your budget range."); return; }
    if (!hasFlat && Number(minBudget) > Number(maxBudget)) { toast.error("Max budget must be above min."); return; }
    if (hasFlat && (!flatArea.trim() || !flatPostalCode.trim())) { toast.error("Add your flat's area and postal code."); return; }

    setBusy(true);
    try {
      await createFlatmateListing({
        bio: bio.trim(),
        countryOfOrigin: country.trim(),
        language: language.trim(),
        studentType,
        petPreference: "okay",
        housingStatus: hasFlat ? "has_flat" : "seeking_flat",
        minBudget: hasFlat ? undefined : Number(minBudget),
        maxBudget: hasFlat ? undefined : Number(maxBudget),
        preferredCity: hasFlat ? preferredCity : preferredCity,
        flatPrice: hasFlat ? Number(flatPrice) || 0 : undefined,
        flatCity: hasFlat ? preferredCity : undefined,
        flatArea: hasFlat ? flatArea.trim() : undefined,
        flatPostalCode: hasFlat ? flatPostalCode.trim() : undefined,
        flatFeatures: [],
        // Roommate card photo = the user's existing profile picture.
        profileImageUrl: profile?.avatar_url ?? undefined,
        // Flat photos (only when offering a place).
        apartmentImages: hasFlat ? flatPreviews : undefined,
        apartmentImageFiles: hasFlat ? flatFiles : undefined,
        cleanliness,
        sleepSchedule: sleep,
        socialHabits: social,
        studyHabits: study,
      });
      // On success the data context sets myFlatmateListing, so the parent
      // swaps this form for the swipe deck automatically.
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Intro */}
      <div className="nm-card nm-card-lg" style={{ padding: 18, display: "flex", gap: 13, alignItems: "center" }}>
        <span style={{ width: 44, height: 44, flex: "none", borderRadius: 14, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
          <ModuleIcon name="matches" size={22} />
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Create your roommate profile</div>
          <div style={{ fontSize: 12.5, color: "var(--nm-muted)", marginTop: 3, lineHeight: 1.45 }}>
            You need a profile to see and match with other students. Takes a minute.
          </div>
        </div>
      </div>

      {/* Profile photo — reused on your roommate card */}
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 56, height: 56, flex: "none", borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 18px var(--nm-font-text)" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(profile?.full_name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Your photo</div>
          <div style={{ fontSize: 12, color: "var(--nm-muted)", marginTop: 2, lineHeight: 1.45 }}>
            {profile?.avatar_url ? "This photo from your profile is shown to roommates." : "Add a profile photo in Profile to stand out — initials show until then."}
          </div>
        </div>
      </div>

      <Field label="About you">
        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} placeholder="Your lifestyle, study habits, what you're looking for…" value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Country"><input style={inputStyle} placeholder="e.g. Ghana" value={country} onChange={(e) => setCountry(e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Language"><input style={inputStyle} placeholder="e.g. English" value={language} onChange={(e) => setLanguage(e.target.value)} /></Field></div>
      </div>

      <Field label="You are">
        <select style={inputStyle} value={studentType} onChange={(e) => setStudentType(e.target.value as StudentType)}>
          <option value="full_time">Full-time student</option>
          <option value="erasmus">Erasmus / short-term</option>
        </select>
      </Field>

      {/* Housing status toggle */}
      <div style={{ display: "flex", gap: 8, background: "var(--nm-surface2)", borderRadius: 99, padding: 4 }}>
        {[["Looking for a place", false], ["I have a place", true]].map(([label, val]) => {
          const on = hasFlat === val;
          return (
            <button key={String(val)} type="button" onClick={() => setHasFlat(val as boolean)} style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 99, font: "600 13px var(--nm-font-text)", background: on ? "var(--nm-surface)" : "transparent", color: on ? "var(--nm-text)" : "var(--nm-muted)", boxShadow: on ? "var(--nm-elev)" : "none" }}>
              {label as string}
            </button>
          );
        })}
      </div>

      <Field label="City"><select style={inputStyle} value={preferredCity} onChange={(e) => setPreferredCity(e.target.value as City)}>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>

      {!hasFlat ? (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="Min budget (€)"><input style={inputStyle} type="number" placeholder="350" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Max budget (€)"><input style={inputStyle} type="number" placeholder="650" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} /></Field></div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Rent (€/mo)"><input style={inputStyle} type="number" placeholder="500" value={flatPrice} onChange={(e) => setFlatPrice(e.target.value)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Area"><input style={inputStyle} placeholder="Aglantzia" value={flatArea} onChange={(e) => setFlatArea(e.target.value)} /></Field></div>
          </div>
          <Field label="Postal code"><input style={inputStyle} placeholder="2109" value={flatPostalCode} onChange={(e) => setFlatPostalCode(e.target.value)} /></Field>
          <Field label="Photos of your flat">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {flatPreviews.map((src, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--nm-r-sm)", overflow: "hidden" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => removeFlatImage(i)} aria-label="Remove" style={{ all: "unset", cursor: "pointer", position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 99, background: "rgba(0,0,0,.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => flatInputRef.current?.click()} style={{ all: "unset", cursor: "pointer", aspectRatio: "1", borderRadius: "var(--nm-r-sm)", border: "1px dashed var(--nm-line)", background: "var(--nm-surface2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: "var(--nm-muted)" }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
                <span style={{ fontSize: 10 }}>Add photo</span>
              </button>
            </div>
            <input ref={flatInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onFlatImages} />
          </Field>
        </>
      )}

      {/* Lifestyle → powers match scores */}
      <div className="nm-section-label" style={{ marginTop: 4 }}>Lifestyle (powers your match score)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Cleanliness"><select style={inputStyle} value={cleanliness} onChange={(e) => setCleanliness(e.target.value as Cleanliness)}>{CLEANLINESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field label="Sleep"><select style={inputStyle} value={sleep} onChange={(e) => setSleep(e.target.value as SleepSchedule)}>{SLEEP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field label="Social"><select style={inputStyle} value={social} onChange={(e) => setSocial(e.target.value as SocialHabits)}>{SOCIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field label="Study"><select style={inputStyle} value={study} onChange={(e) => setStudy(e.target.value as StudyHabits)}>{STUDY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
      </div>

      <button type="button" disabled={busy} onClick={() => void submit()} style={{ all: "unset", cursor: "pointer", textAlign: "center", padding: 16, borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 16px var(--nm-font-text)", opacity: busy ? 0.7 : 1, marginTop: 4 }}>
        {busy ? "Creating…" : "Create profile & start matching"}
      </button>
    </div>
  );
}
