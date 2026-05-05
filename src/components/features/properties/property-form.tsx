import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cities } from "@/lib/constants";

const propertySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  city: z.enum(cities),
  address: z.string().min(4),
  rentPrice: z.coerce.number().min(0),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(0),
  availableTo: z.enum(["erasmus", "full_time"]),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  phone: z.string().min(3),
  email: z.string().email(),
  hasWhatsapp: z.boolean().default(false)
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export function PropertyForm() {
  const [images, setImages] = useState<string[]>([]);
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      description: "",
      city: "Nicosia",
      address: "",
      rentPrice: 500,
      bedrooms: 1,
      bathrooms: 1,
      availableTo: "full_time",
      latitude: 35.1264,
      longitude: 33.4299,
      phone: "",
      email: "",
      hasWhatsapp: true
    }
  });

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl">Add or edit a property</h3>
          <p className="text-sm text-muted-foreground">
            Storage-backed uploads, visibility controls, and AI-assisted copywriting.
          </p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            const values = form.getValues();
            form.setValue(
              "description",
              `${values.title} is a student-friendly ${values.bedrooms}-bedroom home in ${values.city} with ${values.bathrooms} bathroom(s), easy access to transport, and a welcoming setup for ${values.availableTo === "erasmus" ? "short-term" : "full-time"} students.`
            );
          }}
        >
          <Sparkles size={16} />
          AI description
        </Button>
      </div>

      <form className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Listing title" {...form.register("title")} />
        <Input placeholder="Street / area" {...form.register("address")} />
        <Select {...form.register("city")}>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Select {...form.register("availableTo")}>
          <option value="erasmus">Erasmus / short-term</option>
          <option value="full_time">Full-time</option>
        </Select>
        <Input type="number" placeholder="Rent" {...form.register("rentPrice")} />
        <Input type="number" placeholder="Bedrooms" {...form.register("bedrooms")} />
        <Input type="number" placeholder="Bathrooms" {...form.register("bathrooms")} />
        <Input type="email" placeholder="Contact email" {...form.register("email")} />
        <Input placeholder="Phone number" {...form.register("phone")} />
        <Input type="number" step="0.000001" placeholder="Latitude" {...form.register("latitude")} />
        <Input type="number" step="0.000001" placeholder="Longitude" {...form.register("longitude")} />
        <Input
          placeholder="Add image URL and press Enter"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const value = (event.target as HTMLInputElement).value.trim();
            if (!value || images.length >= 5) return;
            setImages((current) => [...current, value]);
            (event.target as HTMLInputElement).value = "";
          }}
        />
        <div className="md:col-span-2">
          <Textarea placeholder="Describe the property..." {...form.register("description")} />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {images.map((image) => (
            <img key={image} src={image} alt="Upload preview" className="h-20 w-20 rounded-2xl object-cover" />
          ))}
        </div>
      </form>
    </Card>
  );
}
