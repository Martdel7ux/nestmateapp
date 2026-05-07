import { useRef, useState } from "react";
import {
  Bath, Bed, Eye, EyeOff, Home, ImagePlus, MapPin,
  Pencil, Plus, Sparkles, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useData } from "@/contexts/data-context";
import { cities } from "@/lib/constants";
import { currency } from "@/lib/utils";
import type { City, Property } from "@/types/supabase";

// ── Shared form fields used by both Add and Edit sheets ───────────────────────
interface PropertyFields {
  title: string;
  city: City;
  address: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  availableTo: "erasmus" | "full_time";
  description: string;
  phone: string;
  email: string;
  images: string[];
}

function usePropertyFields(defaults?: Partial<PropertyFields>) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [city, setCity] = useState<City>(defaults?.city ?? "Nicosia");
  const [address, setAddress] = useState(defaults?.address ?? "");
  const [price, setPrice] = useState(defaults?.price ?? "");
  const [bedrooms, setBedrooms] = useState(defaults?.bedrooms ?? "1");
  const [bathrooms, setBathrooms] = useState(defaults?.bathrooms ?? "1");
  const [availableTo, setAvailableTo] = useState<"erasmus" | "full_time">(defaults?.availableTo ?? "full_time");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [images, setImages] = useState<string[]>(defaults?.images ?? []);
  const photoRef = useRef<HTMLInputElement>(null);

  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length;
    const newUrls = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...newUrls]);
    e.target.value = "";
  };

  const generateDescription = () => {
    if (!title) return;
    setDescription(
      `${title} is a student-friendly ${bedrooms}-bedroom property in ${city} with ${bathrooms} bathroom(s), ideal for ${availableTo === "erasmus" ? "short-term Erasmus" : "full-time"} students. Conveniently located at ${address || "a great location"}.`
    );
  };

  const isValid = () => {
    if (!title || !address || !price || !phone || !email) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const fields = { title, city, address, price, bedrooms, bathrooms, availableTo, description, phone, email, images };
  const setters = { setTitle, setCity, setAddress, setPrice, setBedrooms, setBathrooms, setAvailableTo, setDescription, setPhone, setEmail, setImages, photoRef, handlePhotoFiles };

  return { fields, setters, generateDescription, isValid };
}

// ── Shared form body ──────────────────────────────────────────────────────────
function PropertyFormBody({
  fields,
  setters,
  generateDescription,
}: ReturnType<typeof usePropertyFields>) {
  const { title, city, address, price, bedrooms, bathrooms, availableTo, description, phone, email, images } = fields;
  const { setTitle, setCity, setAddress, setPrice, setBedrooms, setBathrooms, setAvailableTo, setDescription, setPhone, setEmail, setImages, photoRef, handlePhotoFiles } = setters;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Property title *</label>
        <Input placeholder="e.g. Sunlit studio near campus" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">City *</label>
          <Select value={city} onChange={(e) => setCity(e.target.value as City)}>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Available to *</label>
          <Select value={availableTo} onChange={(e) => setAvailableTo(e.target.value as "erasmus" | "full_time")}>
            <option value="full_time">Full-time</option>
            <option value="erasmus">Erasmus</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Street / area *</label>
        <Input placeholder="e.g. Aglantzia, Nicosia" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Rent (€/mo) *</label>
          <Input type="number" placeholder="500" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bedrooms</label>
          <Input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bathrooms</label>
          <Input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Phone *</label>
          <Input placeholder="+357 99 000000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email *</label>
          <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Description</label>
          <button
            type="button"
            onClick={generateDescription}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            <Sparkles size={11} /> AI generate
          </button>
        </div>
        <textarea
          rows={3}
          placeholder="Describe your property…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Photos</label>
          <span className="text-xs text-muted-foreground">{images.length}/5</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  Cover
                </span>
              )}
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <ImagePlus size={20} />
              <span className="text-[10px] font-medium">Add photo</span>
            </button>
          )}
        </div>
        <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoFiles} />
      </div>
    </div>
  );
}

// ── Bottom sheet wrapper ──────────────────────────────────────────────────────
function SheetWrapper({ title, subtitle, onClose, children }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[2rem] bg-background shadow-card"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) onClose();
        }}
      >
        <div className="shrink-0">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="mx-auto mt-3 mb-1 block h-1 w-10 rounded-full bg-border cursor-pointer hover:bg-muted-foreground/40 transition-colors"
          />
        </div>
        <div
          className="flex-1 overflow-y-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="space-y-5 px-5 pb-10 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <X size={16} />
              </button>
            </div>
            {children}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Add property sheet ────────────────────────────────────────────────────────
function AddPropertySheet({ onClose }: { onClose: () => void }) {
  const { createProperty } = useData();
  const form = usePropertyFields();
  const { fields, isValid } = form;

  const handleSubmit = async () => {
    if (!isValid()) return;
    await createProperty({
      title: fields.title,
      city: fields.city,
      address: fields.address,
      rent_price: Number(fields.price),
      bedrooms: Number(fields.bedrooms),
      bathrooms: Number(fields.bathrooms),
      available_to: fields.availableTo,
      description: fields.description,
      phone: fields.phone,
      email: fields.email,
      image_urls: fields.images,
    });
    onClose();
  };

  return (
    <SheetWrapper title="Add Property" subtitle="Fill in your listing details" onClose={onClose}>
      <PropertyFormBody {...form} />
      <Button className="w-full" size="lg" onClick={() => { void handleSubmit(); }}>Submit for Review</Button>
    </SheetWrapper>
  );
}

// ── Edit property sheet ───────────────────────────────────────────────────────
function EditPropertySheet({ property, onClose }: { property: Property; onClose: () => void }) {
  const { updateProperty } = useData();
  const form = usePropertyFields({
    title: property.title,
    city: property.city as City,
    address: property.address,
    price: String(property.rent_price),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    availableTo: property.available_to as "erasmus" | "full_time",
    description: property.description,
    phone: property.phone ?? "",
    email: property.email ?? "",
    images: property.image_urls,
  });
  const { fields, isValid } = form;

  const handleSave = () => {
    if (!isValid()) return;
    updateProperty(property.id, {
      title: fields.title,
      city: fields.city as City,
      address: fields.address,
      rent_price: Number(fields.price),
      bedrooms: Number(fields.bedrooms),
      bathrooms: Number(fields.bathrooms),
      available_to: fields.availableTo,
      description: fields.description,
      phone: fields.phone,
      email: fields.email,
      image_urls: fields.images,
    });
    toast.success("Property updated.");
    onClose();
  };

  return (
    <SheetWrapper title="Edit Property" subtitle="Update your listing details" onClose={onClose}>
      <PropertyFormBody {...form} />
      <Button className="w-full" size="lg" onClick={handleSave}>Save Changes</Button>
    </SheetWrapper>
  );
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({
  property,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  property: Property;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusLabel = !property.is_approved ? "Pending review" : property.is_visible ? "Active" : "Hidden";
  const statusClass = !property.is_approved
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
    : property.is_visible
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
    : "bg-muted text-muted-foreground";

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative h-48">
        {property.image_urls[0] ? (
          <img src={property.image_urls[0]} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Home size={32} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
          {statusLabel}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
          {currency(property.rent_price)}/mo
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold leading-tight">{property.title}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={11} />
            <span>{property.address}, {property.city}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Eye size={13} />{property.views_count ?? 0} views</span>
          <span className="flex items-center gap-1"><Bed size={13} />{property.bedrooms} bed</span>
          <span className="flex items-center gap-1"><Bath size={13} />{property.bathrooms} bath</span>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
            {property.available_to === "erasmus" ? "Erasmus" : "Full-time"}
          </span>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition ${
              property.is_visible
                ? "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-500"
                : "border-primary/30 bg-primary/5 text-primary"
            }`}
          >
            {property.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}
            {property.is_visible ? "Hide" : "Show"}
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Pencil size={13} />
            Edit
          </button>

          {confirmDelete ? (
            <div className="flex flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-border py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete(); }}
                className="flex-1 rounded-xl bg-destructive py-2 text-xs font-medium text-destructive-foreground"
              >
                Confirm
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function LandlordDashboardPage() {
  const { snapshot, togglePropertyVisibility, deleteProperty } = useData();
  const [addOpen, setAddOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const myProperties = snapshot.featuredProperties.filter(
    (p) => p.owner_id === snapshot.profile.id
  );

  return (
    <div className="space-y-5 px-5 pt-4 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My Properties</h1>
          <p className="text-sm text-muted-foreground">
            {myProperties.length === 0
              ? "No listings yet"
              : `${myProperties.length} listing${myProperties.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95"
        >
          <Plus size={15} /> Add listing
        </button>
      </div>

      {/* ── Property list ── */}
      {myProperties.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Home size={24} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No properties yet</p>
            <p className="mt-0.5 text-sm text-muted-foreground px-6">Add your first listing to start attracting students.</p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <Plus size={15} /> Add first property
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={() => setEditingProperty(property)}
              onToggleVisibility={() => togglePropertyVisibility(property.id)}
              onDelete={() => {
                deleteProperty(property.id);
                toast.success("Property deleted.");
              }}
            />
          ))}
        </div>
      )}

      {/* ── Add sheet ── */}
      <AnimatePresence>
        {addOpen && <AddPropertySheet key="add" onClose={() => setAddOpen(false)} />}
      </AnimatePresence>

      {/* ── Edit sheet ── */}
      <AnimatePresence>
        {editingProperty && (
          <EditPropertySheet
            key={editingProperty.id}
            property={editingProperty}
            onClose={() => setEditingProperty(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
