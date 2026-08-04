import { requireSupabase } from "@/lib/supabase";

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description?: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  city?: string | null;
  status: string;
  created_at: string;
  seller?: { full_name: string } | null;
}

export interface StudentPerk {
  id: string;
  name: string;
  description?: string | null;
  discount: string;
  category?: string | null;
  city?: string | null;
  url?: string | null;
  is_active: boolean;
  created_at: string;
}

export async function fetchMarketplaceListings(): Promise<MarketplaceListing[]> {
  const { data, error } = await requireSupabase()
    .from("marketplace_listings")
    .select("*, seller:profiles!seller_id(full_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as MarketplaceListing[];
}

export async function createMarketplaceListing(input: {
  sellerId: string;
  title: string;
  price: number;
  category: string;
  description?: string;
  city?: string;
  imageFile?: File | null;
}): Promise<void> {
  const client = requireSupabase();

  // Optional photo of the item → public property-images bucket.
  let image_url: string | null = null;
  if (input.imageFile) {
    const ext = input.imageFile.name.split(".").pop() ?? "jpg";
    const path = `marketplace/${input.sellerId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await client.storage
      .from("property-images")
      .upload(path, input.imageFile, { upsert: false });
    if (uploadError) throw uploadError;
    image_url = client.storage.from("property-images").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await client.from("marketplace_listings").insert({
    seller_id: input.sellerId,
    title: input.title,
    price: input.price,
    category: input.category,
    description: input.description ?? null,
    city: input.city ?? null,
    image_url,
  });
  if (error) throw error;
}

export async function fetchPerks(): Promise<StudentPerk[]> {
  const { data, error } = await requireSupabase()
    .from("student_perks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as StudentPerk[];
}
