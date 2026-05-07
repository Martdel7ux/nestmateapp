import { useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CheckCircle2, Home, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";
import { cities } from "@/lib/constants";

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

const flatmateSchema = z.object({
  bio: z.string().min(12, "Write at least 12 characters about yourself"),
  countryOfOrigin: z.string().min(1, "Please select your country"),
  language: z.string().min(1, "Please select your language"),
  studentType: z.enum(["erasmus", "full_time"]),
  petPreference: z.enum(["love", "okay", "neutral", "no"]),
  housingStatus: z.enum(["has_flat", "seeking_flat"]),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  preferredCity: z.enum(cities).optional(),
  flatPrice: z.coerce.number().min(0).optional(),
  flatCity: z.enum(cities).optional(),
  apartmentDescription: z.string().optional()
});

type FlatmateValues = z.infer<typeof flatmateSchema>;

export function FlatmateForm() {
  const { createFlatmateListing } = useData();
  const [submitted, setSubmitted] = useState(false);

  // Profile photo
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  // Flat images
  const [flatFiles, setFlatFiles] = useState<File[]>([]);
  const [flatPreviews, setFlatPreviews] = useState<string[]>([]);
  const flatImgRef = useRef<HTMLInputElement>(null);

  // Flat features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Country/language search filter
  const [countrySearch, setCountrySearch] = useState("");
  const [langSearch, setLangSearch] = useState("");

  const form = useForm<FlatmateValues>({
    resolver: zodResolver(flatmateSchema),
    defaultValues: {
      bio: "",
      countryOfOrigin: "",
      language: "",
      studentType: "full_time",
      petPreference: "okay",
      housingStatus: "seeking_flat",
      minBudget: 350,
      maxBudget: 650,
      preferredCity: "Nicosia",
      flatPrice: 0,
      flatCity: "Nicosia",
      apartmentDescription: ""
    }
  });

  const housingStatus = form.watch("housingStatus");

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
    setFlatFiles((prev) => [...prev, ...files]);
    setFlatPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeFlatImage = (index: number) => {
    setFlatFiles((prev) => prev.filter((_, i) => i !== index));
    setFlatPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const onSubmit = (values: FlatmateValues) => {
    createFlatmateListing({
      ...values,
      profileImageUrl: profilePreview ?? undefined,
      flatFeatures: selectedFeatures,
      apartmentImages: flatPreviews
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="space-y-3 py-10 text-center">
        <CheckCircle2 className="mx-auto text-primary" size={36} />
        <h3 className="font-display text-2xl">Listing Submitted!</h3>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Your flatmate listing is pending admin approval. You'll be able to start swiping once it's reviewed.
        </p>
      </Card>
    );
  }

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const filteredLanguages = LANGUAGES.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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
            {...form.register("bio")}
          />
          {form.formState.errors.bio && (
            <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Country dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Country of origin</label>
            <div className="space-y-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country…"
                  className="w-full rounded-xl border border-input bg-background py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Select {...form.register("countryOfOrigin")} className="max-h-40">
                <option value="">Select your country</option>
                {filteredCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            {form.formState.errors.countryOfOrigin && (
              <p className="text-xs text-destructive">{form.formState.errors.countryOfOrigin.message}</p>
            )}
          </div>

          {/* Language dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Primary language</label>
            <div className="space-y-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search language…"
                  className="w-full rounded-xl border border-input bg-background py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Select {...form.register("language")} className="max-h-40">
                <option value="">Select your language</option>
                {filteredLanguages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>
            {form.formState.errors.language && (
              <p className="text-xs text-destructive">{form.formState.errors.language.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Student type</label>
            <Select {...form.register("studentType")}>
              <option value="full_time">Full-time student</option>
              <option value="erasmus">Erasmus / short-term</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pets</label>
            <Select {...form.register("petPreference")}>
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
        onClick={() =>
          form.setValue("housingStatus", housingStatus === "has_flat" ? "seeking_flat" : "has_flat")
        }
        className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
          housingStatus === "has_flat"
            ? "border-primary bg-primary/5"
            : "border-border bg-card/60 hover:border-primary/40"
        }`}
      >
        {/* Custom checkbox */}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
            housingStatus === "has_flat"
              ? "border-primary bg-primary"
              : "border-border bg-background"
          }`}
        >
          {housingStatus === "has_flat" && (
            <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-primary-foreground stroke-2">
              <polyline points="1,5 4,8 11,1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-semibold">I already have a flat and I'm looking for a flatmate</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {housingStatus === "has_flat"
              ? "You'll be asked to share your flat details, photos and rent price below"
              : "Leave unticked if you're looking for a flat to move into"}
          </p>
        </div>
      </button>

      {/* ── Seeking flat: budget + city ── */}
      {housingStatus === "seeking_flat" && (
        <Card className="space-y-4">
          <h3 className="font-display text-xl">Budget &amp; Preferences</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min budget (€/mo)</label>
              <Input type="number" placeholder="350" {...form.register("minBudget")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max budget (€/mo)</label>
              <Input type="number" placeholder="650" {...form.register("maxBudget")} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Preferred city</label>
              <Select {...form.register("preferredCity")}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* ── Has flat: details ── */}
      {housingStatus === "has_flat" && (
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
              <Input type="number" placeholder="500" {...form.register("flatPrice")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City</label>
              <Select {...form.register("flatCity")}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
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
              {...form.register("apartmentDescription")}
            />
          </div>
        </Card>
      )}

      <Button type="submit" className="w-full" size="lg">
        <Home size={16} />
        Submit Flatmate Listing
      </Button>
    </form>
  );
}
