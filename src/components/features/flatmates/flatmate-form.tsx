import { useRef, useState } from "react";
import { Camera, Home, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";
import { cities } from "@/lib/constants";
import type { City, StudentType } from "@/types/supabase";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Benin","Bolivia",
  "Bosnia and Herzegovina","Brazil","Bulgaria","Burkina Faso","Cambodia","Cameroon","Canada",
  "Chile","China","Colombia","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia",
  "Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Latvia","Lebanon","Libya","Lithuania",
  "Luxembourg","Malaysia","Mali","Malta","Mexico","Moldova","Mongolia","Montenegro","Morocco",
  "Mozambique","Myanmar","Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Macedonia",
  "Norway","Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Sierra Leone",
  "Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","Spain","Sri Lanka",
  "Sudan","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo",
  "Tunisia","Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const LANGUAGES = [
  "Arabic","Armenian","Bengali","Bulgarian","Chinese (Cantonese)","Chinese (Mandarin)",
  "Croatian","Czech","Danish","Dutch","English","Estonian","Filipino","Finnish","French",
  "Georgian","German","Greek","Hebrew","Hindi","Hungarian","Indonesian","Italian","Japanese",
  "Kazakh","Korean","Latvian","Lithuanian","Malay","Maltese","Norwegian","Persian/Farsi",
  "Polish","Portuguese","Romanian","Russian","Serbian","Slovak","Slovenian","Spanish",
  "Swedish","Tamil","Thai","Turkish","Ukrainian","Urdu","Uzbek","Vietnamese"
];

const FLAT_FEATURES = [
  "WiFi", "Furnished", "Parking", "Bills Included", "Air Conditioning",
  "Washing Machine", "Dishwasher", "Garden / Yard", "Balcony", "Pet Friendly",
  "Near University", "City Centre", "Gym Access", "Swimming Pool"
];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive">{msg}</p>;
}

export function FlatmateForm() {
  const { createFlatmateListing } = useData();

  // Profile photo
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  // Flat images
  const [flatPreviews, setFlatPreviews] = useState<string[]>([]);
  const [flatImageFiles, setFlatImageFiles] = useState<File[]>([]);
  const flatImgRef = useRef<HTMLInputElement>(null);

  // Flat features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Form fields
  const [bio, setBio] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [language, setLanguage] = useState("");
  const [studentType, setStudentType] = useState<StudentType>("full_time");
  const [petPreference, setPetPreference] = useState<"love" | "okay" | "neutral" | "no">("okay");
  const [hasFlat, setHasFlat] = useState(false);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [preferredCity, setPreferredCity] = useState<City>("Nicosia");
  const [flatPrice, setFlatPrice] = useState("");
  const [flatCity, setFlatCity] = useState<City>("Nicosia");
  const [flatArea, setFlatArea] = useState("");
  const [flatPostalCode, setFlatPostalCode] = useState("");
  const [apartmentDescription, setApartmentDescription] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleFlatImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setFlatPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    setFlatImageFiles((prev) => [...prev, ...files]);
  };

  const removeFlatImage = (index: number) => {
    setFlatPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (bio.trim().length < 12) errs.bio = "Write at least 12 characters about yourself";
    if (!countryOfOrigin) errs.countryOfOrigin = "Please select your country";
    if (!language) errs.language = "Please select your language";
    if (!hasFlat) {
      if (!minBudget) errs.minBudget = "Please enter your minimum budget";
      if (!maxBudget) errs.maxBudget = "Please enter your maximum budget";
      if (minBudget && maxBudget && Number(minBudget) > Number(maxBudget))
        errs.maxBudget = "Max budget must be greater than min";
    } else {
      if (!flatArea.trim()) errs.flatArea = "Please enter the area / neighbourhood";
      if (!flatPostalCode.trim()) errs.flatPostalCode = "Please enter the postal code";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to top so user sees the error messages
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    await createFlatmateListing({
      bio: bio.trim(),
      countryOfOrigin,
      language,
      studentType,
      petPreference,
      housingStatus: hasFlat ? "has_flat" : "seeking_flat",
      minBudget: hasFlat ? undefined : Number(minBudget),
      maxBudget: hasFlat ? undefined : Number(maxBudget),
      preferredCity: hasFlat ? flatCity : preferredCity,
      flatPrice: hasFlat ? Number(flatPrice) : undefined,
      flatCity: hasFlat ? flatCity : undefined,
      flatArea: hasFlat ? flatArea.trim() : undefined,
      flatPostalCode: hasFlat ? flatPostalCode.trim() : undefined,
      flatFeatures: selectedFeatures,
      apartmentDescription: apartmentDescription.trim() || undefined,
      profileImageUrl: profilePreview ?? undefined,
      profileImageFile: profileFile ?? undefined,
      apartmentImages: flatPreviews,
      apartmentImageFiles: flatImageFiles,
    });
    setSubmitting(false);
  };


  return (
    <div ref={formTopRef} className="space-y-6">

      {/* ── Profile Photo ── */}
      <Card className="space-y-4">
        <h3 className="font-display text-xl">Your Photo</h3>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => profileRef.current?.click()}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {profilePreview ? (
              <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <Camera size={24} className="text-muted-foreground" />
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition hover:opacity-100">
              <Camera size={20} className="text-white" />
            </div>
          </button>
          <div>
            <p className="font-medium">Upload a clear photo of yourself</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This is shown to potential flatmates. A friendly photo helps you get more matches.
            </p>
            <button
              type="button"
              onClick={() => profileRef.current?.click()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {profilePreview ? "Change photo" : "Choose photo"}
            </button>
          </div>
          <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileChange} />
        </div>
      </Card>

      {/* ── About You ── */}
      <Card className="space-y-4">
        <h3 className="font-display text-xl">About You</h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bio — tell flatmates about your lifestyle</label>
          <Textarea
            placeholder="E.g. I'm a second-year Computer Science student. I'm tidy, quiet during weekdays, and love cooking. Looking for a chill, respectful flatmate..."
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <FieldError msg={errors.bio} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Country of origin</label>
            <Select value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)}>
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <FieldError msg={errors.countryOfOrigin} />
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Primary language</label>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Select your language</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
            <FieldError msg={errors.language} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Student type</label>
            <Select value={studentType} onChange={(e) => setStudentType(e.target.value as StudentType)}>
              <option value="full_time">Full-time student</option>
              <option value="erasmus">Erasmus / short-term</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pets</label>
            <Select value={petPreference} onChange={(e) => setPetPreference(e.target.value as "love" | "okay" | "neutral" | "no")}>
              <option value="love">Love pets 🐾</option>
              <option value="okay">Okay with pets</option>
              <option value="neutral">Neutral</option>
              <option value="no">No pets please</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Housing Status ── */}
      <button
        type="button"
        onClick={() => setHasFlat((v) => !v)}
        className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
          hasFlat ? "border-primary bg-primary/5" : "border-border bg-card/60 hover:border-primary/40"
        }`}
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
            hasFlat ? "border-primary bg-primary" : "border-border bg-background"
          }`}
        >
          {hasFlat && (
            <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-primary-foreground stroke-2">
              <polyline points="1,5 4,8 11,1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-semibold">I already have a flat and I'm looking for a flatmate</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasFlat
              ? "You'll be asked to share your flat details, photos and rent price below"
              : "Leave unticked if you're looking for a flat to move into"}
          </p>
        </div>
      </button>

      {/* ── Seeking flat: budget + city ── */}
      {!hasFlat && (
        <Card className="space-y-4">
          <h3 className="font-display text-xl">Budget &amp; Preferences</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min budget (€/mo)</label>
              <Input
                type="number"
                placeholder="350"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
              <FieldError msg={errors.minBudget} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max budget (€/mo)</label>
              <Input
                type="number"
                placeholder="650"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <FieldError msg={errors.maxBudget} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Preferred city</label>
              <Select value={preferredCity} onChange={(e) => setPreferredCity(e.target.value as City)}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* ── Has flat: details ── */}
      {hasFlat && (
        <Card className="space-y-5">
          <div>
            <h3 className="font-display text-xl">Your Flat Details</h3>
            <p className="text-sm text-muted-foreground">Help potential flatmates understand what you're offering</p>
          </div>

          {/* Flat photos */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Photos of your flat</label>
            <div className="grid grid-cols-3 gap-2">
              {flatPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                  <img src={src} alt={`Flat ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFlatImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => flatImgRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-muted transition hover:border-primary"
              >
                <Plus size={20} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Add photo</span>
              </button>
            </div>
            <input
              ref={flatImgRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFlatImagesChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monthly rent (€/mo)</label>
              <Input
                type="number"
                placeholder="500"
                value={flatPrice}
                onChange={(e) => setFlatPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City</label>
              <Select value={flatCity} onChange={(e) => setFlatCity(e.target.value as City)}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Area / Neighbourhood</label>
              <Input
                type="text"
                placeholder="e.g. Aglantzia, Strovolos"
                value={flatArea}
                onChange={(e) => setFlatArea(e.target.value)}
              />
              <FieldError msg={errors.flatArea} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Postal code</label>
              <Input
                type="text"
                placeholder="e.g. 2109"
                value={flatPostalCode}
                onChange={(e) => setFlatPostalCode(e.target.value)}
              />
              <FieldError msg={errors.flatPostalCode} />
            </div>
          </div>

          {/* Flat features */}
          <div className="space-y-2">
            <label className="text-sm font-medium">What's included / features</label>
            <div className="flex flex-wrap gap-2">
              {FLAT_FEATURES.map((feature) => {
                const active = selectedFeatures.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                      active
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "border border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {active ? "✓ " : ""}{feature}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Describe your flat</label>
            <Textarea
              placeholder="Tell potential flatmates about the flat — size, vibe, location, house rules, etc."
              rows={4}
              value={apartmentDescription}
              onChange={(e) => setApartmentDescription(e.target.value)}
            />
          </div>
        </Card>
      )}

      <Button type="button" className="w-full" size="lg" onClick={() => { void handleSubmit(); }} disabled={submitting}>
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Home size={16} />
        )}
        {submitting ? "Submitting…" : "Submit Flatmate Listing"}
      </Button>
    </div>
  );
}
