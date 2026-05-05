import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/data-context";
import { cities } from "@/lib/constants";

const flatmateSchema = z.object({
  bio: z.string().min(12),
  minBudget: z.coerce.number().min(0),
  maxBudget: z.coerce.number().min(0),
  preferredCity: z.enum(cities),
  studentType: z.enum(["erasmus", "full_time"]),
  petPreference: z.enum(["love", "okay", "neutral", "no"]),
  countryOfOrigin: z.string().min(2),
  housingStatus: z.enum(["has_flat", "seeking_flat"]),
  apartmentDescription: z.string().optional()
});

type FlatmateValues = z.infer<typeof flatmateSchema>;

export function FlatmateForm() {
  const { createFlatmateListing } = useData();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FlatmateValues>({
    resolver: zodResolver(flatmateSchema),
    defaultValues: {
      bio: "",
      minBudget: 350,
      maxBudget: 650,
      preferredCity: "Nicosia",
      studentType: "full_time",
      petPreference: "okay",
      countryOfOrigin: "",
      housingStatus: "seeking_flat",
      apartmentDescription: ""
    }
  });

  const onSubmit = (values: FlatmateValues) => {
    createFlatmateListing(values);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="space-y-3 text-center py-8">
        <CheckCircle2 className="mx-auto text-primary" size={32} />
        <h3 className="font-display text-2xl">Listing Submitted</h3>
        <p className="text-sm text-muted-foreground">
          Your flatmate listing is pending admin approval. You'll be able to start swiping once it's reviewed.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="font-display text-2xl">Create your flatmate listing</h3>
        <p className="text-sm text-muted-foreground">
          Students need a listing before browsing others, which keeps matching reciprocal and more trustworthy.
        </p>
      </div>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="md:col-span-2">
          <Textarea
            placeholder="Tell future flatmates about your habits, vibe, and routine."
            {...form.register("bio")}
          />
        </div>
        <Input type="number" placeholder="Min budget (€)" {...form.register("minBudget")} />
        <Input type="number" placeholder="Max budget (€)" {...form.register("maxBudget")} />
        <Select {...form.register("preferredCity")}>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Select {...form.register("studentType")}>
          <option value="erasmus">Erasmus / short-term</option>
          <option value="full_time">Full-time</option>
        </Select>
        <Select {...form.register("petPreference")}>
          <option value="love">Love pets</option>
          <option value="okay">Okay with pets</option>
          <option value="neutral">Neutral</option>
          <option value="no">No pets</option>
        </Select>
        <Select {...form.register("housingStatus")}>
          <option value="has_flat">I have a flat — looking for a flatmate</option>
          <option value="seeking_flat">I need a flat — looking to join one</option>
        </Select>
        <Input placeholder="Country of origin" {...form.register("countryOfOrigin")} />
        <div className="md:col-span-2">
          <Textarea
            placeholder="Describe your apartment or what you're looking for in a home"
            {...form.register("apartmentDescription")}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit">Save flatmate listing</Button>
        </div>
      </form>
    </Card>
  );
}
