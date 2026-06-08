import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { toast } from "sonner";
import { seedSnapshot } from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import type { AppSnapshot } from "@/types/app";
import type {
  City,
  FlatmateListing,
  LandlordVerification,
  Message,
  NotificationItem,
  Profile,
  Property,
  StudentType,
  Swipe
} from "@/types/supabase";

interface SearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  studentType?: string;
  sort?: "price_asc" | "price_desc" | "date_desc";
}

interface FlatmateFilters {
  city?: string;
  minBudget?: number;
  maxBudget?: number;
  studentType?: string;
}

interface CreateFlatmateInput {
  bio: string;
  countryOfOrigin: string;
  language: string;
  studentType: StudentType;
  petPreference: "love" | "okay" | "neutral" | "no";
  housingStatus: "has_flat" | "seeking_flat";
  // seeking_flat
  minBudget?: number;
  maxBudget?: number;
  preferredCity?: City;
  // has_flat
  flatPrice?: number;
  flatCity?: City;
  flatArea?: string;
  flatPostalCode?: string;
  flatFeatures?: string[];
  apartmentDescription?: string;
  profileImageUrl?: string;
  apartmentImages?: string[];
  profileImageFile?: File;
  apartmentImageFiles?: File[];
}

interface CreatePropertyInput {
  title: string;
  city: City;
  address: string;
  rent_price: number;
  bedrooms: number;
  bathrooms: number;
  available_to: "erasmus" | "full_time";
  description: string;
  phone: string;
  email: string;
  imageFiles: File[];
}

interface DataContextValue {
  snapshot: AppSnapshot;
  allProfiles: Profile[];
  propertyFilters: SearchFilters;
  flatmateFilters: FlatmateFilters;
  setPropertyFilters: (filters: SearchFilters) => void;
  setFlatmateFilters: (filters: FlatmateFilters) => void;
  filteredProperties: Property[];
  filteredFlatmates: FlatmateListing[];
  myFlatmateListing: FlatmateListing | null;
  blockedUserIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  toggleSavedProperty: (property: Property) => void;
  togglePropertyVisibility: (propertyId: string) => void;
  createProperty: (data: CreatePropertyInput) => Promise<void>;
  updateProperty: (propertyId: string, data: Partial<Property>, imageFiles?: File[]) => Promise<void>;
  deleteProperty: (propertyId: string) => void;
  sendMessage: (matchId: string, content: string, attachmentUrl?: string | null, attachmentType?: Message["attachment_type"]) => void;
  markMessagesRead: (matchId: string) => void;
  markNotificationsRead: () => void;
  swipeFlatmate: (flatmateId: string, direction: "left" | "right") => FlatmateListing | null;
  approveFlatmate: (flatmateId: string, approved: boolean) => void;
  approveProperty: (propertyId: string, approved: boolean) => void;
  createFlatmateListing: (data: CreateFlatmateInput) => Promise<void>;
  updateProfile: (data: Partial<Pick<Profile, "full_name" | "bio" | "university" | "city" | "avatar_url" | "area" | "street_address" | "postal_code" | "location_set_at" | "location_confirmed_at">>, avatarFile?: File) => Promise<void>;
  submitVerification: (idFile: File, selfieFile: File) => Promise<void>;
  approveVerification: (landlordId: string) => void;
  rejectVerification: (landlordId: string, reason: string) => void;
  adminDeleteAccount: (userId: string) => Promise<void>;
  adminDeleteFlatmate: (flatmateId: string) => void;
  reloadAdminData: () => Promise<void>;
  reloadData: () => Promise<void>;
  dataLoading: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile: authProfile, isAdmin } = useAuth();
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() => seedSnapshot);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`nestmate_blocked_${user.id}`);
        setBlockedUserIds(stored ? (JSON.parse(stored) as string[]) : []);
      } catch { setBlockedUserIds([]); }
    }
  }, [user?.id]);
  const [propertyFilters, setPropertyFilters] = useState<SearchFilters>({
    sort: "date_desc"
  });
  const [flatmateFilters, setFlatmateFilters] = useState<FlatmateFilters>({});

  // Keep snapshot profile in sync with real auth profile
  useEffect(() => {
    if (authProfile) {
      setSnapshot((current) => ({ ...current, profile: authProfile }));
    }
  }, [authProfile]);

  // Reset to mock data when user logs out
  useEffect(() => {
    if (!user) {
      setSnapshot(seedSnapshot);
    }
  }, [user]);

  // Load all data from Supabase when a user session is available
  useEffect(() => {
    if (!supabase || !user) return;
    setDataLoading(true);
    void loadFromSupabase(user.id).finally(() => setDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load all profiles + all verifications with signed URLs for admin CRM
  useEffect(() => {
    if (!supabase || !isAdmin) return;

    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAllProfiles(data as Profile[]);
          setSnapshot((current) => ({
            ...current,
            stats: { ...current.stats, totalUsers: data.length }
          }));
        }
      });

    // Load all verifications with signed URLs only for admins (deferred from startup)
    supabase
      .from("landlord_verifications")
      .select("*, profile:profiles!landlord_id(*)")
      .limit(200)
      .then(async ({ data: verifsData }) => {
        if (!verifsData?.length) return;
        const withUrls = await Promise.all(
          verifsData.map(async (v: Record<string, unknown>) => {
            try {
              const [{ data: idSigned }, { data: selfieSigned }] = await Promise.all([
                supabase!.storage.from("verification-docs").createSignedUrl(v.id_document_url as string, 3600),
                supabase!.storage.from("verification-docs").createSignedUrl(v.selfie_url as string, 3600)
              ]);
              return { ...v, id_document_url: idSigned?.signedUrl ?? v.id_document_url, selfie_url: selfieSigned?.signedUrl ?? v.selfie_url };
            } catch { return v; }
          })
        );
        setSnapshot((current) => ({
          ...current,
          verifications: withUrls as unknown as LandlordVerification[]
        }));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user?.id]);


  async function loadFromSupabase(userId: string) {
    if (!supabase) return;
    try {
      const [
        { data: propsData },
        { data: flatmatesData },
        { data: matchesData },
        { data: notifsData },
        { data: verifsData },
        { data: savesData },
        { data: swipesData }
      ] = await Promise.all([
        supabase
          .from("properties")
          .select("*, owner:profiles!owner_id(*)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("flatmate_listings").select("*, profile:profiles!user_id(*)").eq("is_approved", true).limit(50),
        supabase
          .from("matches")
          .select("*")
          .or(`user_a.eq.${userId},user_b.eq.${userId}`)
          .limit(100),
        supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
        // Only fetch the current user's own verification — admin loads all via the admin effect
        supabase
          .from("landlord_verifications")
          .select("*, profile:profiles!landlord_id(*)")
          .eq("landlord_id", userId)
          .limit(1),
        supabase.from("property_saves").select("property_id").eq("user_id", userId).limit(500),
        supabase.from("swipes").select("*").eq("swiper_id", userId).limit(500)
      ]);

      const matchIds = (matchesData ?? []).map((m: Record<string, string>) => m.id);
      const { data: msgsData } =
        matchIds.length > 0
          ? await supabase
              .from("messages")
              .select("*")
              .in("match_id", matchIds)
              .order("created_at", { ascending: false })
              .limit(50)
          : { data: [] };

      // Skip signed URL generation on startup — admin panel generates them on demand
      const verificationsWithUrls = verifsData ?? [];

      const savedIds = new Set(
        (savesData ?? []).map((s: Record<string, string>) => s.property_id)
      );
      const savedProps = (propsData ?? []).filter((p: Record<string, string>) =>
        savedIds.has(p.id)
      );

      // Always fetch the user's own listing explicitly — RLS may block it from the main query
      const { data: ownListingData } = await supabase
        .from("flatmate_listings")
        .select("*, profile:profiles!user_id(*)")
        .eq("user_id", userId)
        .maybeSingle();

      const properties = (propsData ?? []) as unknown as Property[];
      const approvedFlatmates = (flatmatesData ?? []) as unknown as FlatmateListing[];

      // Determine own listing: prefer Supabase data, fall back to localStorage cache
      let ownListing = ownListingData as unknown as FlatmateListing | null;
      if (!ownListing) {
        try {
          const cached = localStorage.getItem(`flatmate_submitted_${userId}`);
          if (cached) ownListing = JSON.parse(cached) as FlatmateListing;
        } catch { /* ignore parse errors */ }
      }

      // Merge: own listing always first so myFlatmateListing is never null after submission
      const flatmates = ownListing
        ? [ownListing, ...approvedFlatmates.filter((f) => f.user_id !== userId)]
        : approvedFlatmates;
      const matches = (matchesData ?? []) as AppSnapshot["matches"];
      const swipes = (swipesData ?? []) as unknown as AppSnapshot["swipes"];

      setSnapshot((current) => ({
        ...current,
        featuredProperties: properties,
        savedProperties: savedProps as unknown as Property[],
        flatmates,
        matches,
        swipes,
        messages: ((msgsData ?? []) as unknown as Message[]).reverse(),
        notifications: (notifsData ?? []) as unknown as NotificationItem[],
        verifications: verificationsWithUrls as unknown as LandlordVerification[],
        stats: {
          totalUsers: current.stats.totalUsers,
          totalProperties: properties.length,
          totalMatches: matches.length,
          activeListings: properties.filter((p) => p.is_approved && p.is_visible).length,
        }
      }));
    } catch (err) {
      console.error("Supabase load failed:", err);
    }
  }

  const filteredProperties = useMemo(() => {
    const filtered = snapshot.featuredProperties.filter((property) => {
      if (propertyFilters.city && property.city !== propertyFilters.city) return false;
      if (propertyFilters.minPrice && property.rent_price < propertyFilters.minPrice)
        return false;
      if (propertyFilters.maxPrice && property.rent_price > propertyFilters.maxPrice)
        return false;
      if (propertyFilters.bedrooms && property.bedrooms < propertyFilters.bedrooms)
        return false;
      if (propertyFilters.bathrooms && property.bathrooms < propertyFilters.bathrooms)
        return false;
      if (
        propertyFilters.studentType &&
        property.available_to !== propertyFilters.studentType
      )
        return false;
      return property.is_visible && property.is_approved;
    });

    switch (propertyFilters.sort) {
      case "price_asc":
        return [...filtered].sort((a, b) => a.rent_price - b.rent_price);
      case "price_desc":
        return [...filtered].sort((a, b) => b.rent_price - a.rent_price);
      default:
        return [...filtered].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [propertyFilters, snapshot.featuredProperties]);

  // Use user?.id (auth UID) directly — never stale unlike snapshot.profile.id
  const myFlatmateListing = useMemo(
    () => snapshot.flatmates.find((f) => f.user_id === user?.id) ?? null,
    [snapshot.flatmates, user?.id]
  );

  const filteredFlatmates = useMemo(() => {
    const myListing = myFlatmateListing;

    // Users must fill out their own listing before seeing others
    if (!myListing) return [];

    // Complementary matching:
    // - Seeking a flat → show people who HAVE a flat
    // - Has a flat → show people who are SEEKING a flat
    const targetStatus =
      myListing.housing_status === "seeking_flat" ? "has_flat" : "seeking_flat";

    // Build set of user IDs already swiped by the current user
    const swipedIds = new Set(snapshot.swipes.map((s) => s.swiped_id));

    return snapshot.flatmates.filter((flatmate) => {
      if (!flatmate.is_approved) return false;
      if (flatmate.user_id === user?.id) return false;
      if (flatmate.housing_status !== targetStatus) return false;
      if (swipedIds.has(flatmate.user_id)) return false;
      if (flatmateFilters.city && flatmate.preferred_city !== flatmateFilters.city)
        return false;
      if (flatmateFilters.minBudget && flatmate.max_budget < flatmateFilters.minBudget)
        return false;
      if (flatmateFilters.maxBudget && flatmate.min_budget > flatmateFilters.maxBudget)
        return false;
      if (
        flatmateFilters.studentType &&
        flatmate.student_type !== flatmateFilters.studentType
      )
        return false;
      return true;
    });
  }, [flatmateFilters, snapshot.flatmates, snapshot.swipes, user?.id, myFlatmateListing]);

  const value = useMemo<DataContextValue>(
    () => ({
      snapshot,
      allProfiles,
      propertyFilters,
      flatmateFilters,
      setPropertyFilters,
      setFlatmateFilters,
      filteredProperties,
      filteredFlatmates,

      blockedUserIds,

      blockUser(userId) {
        const updated = [...blockedUserIds, userId];
        setBlockedUserIds(updated);
        if (user) localStorage.setItem(`nestmate_blocked_${user.id}`, JSON.stringify(updated));
      },

      unblockUser(userId) {
        const updated = blockedUserIds.filter((id) => id !== userId);
        setBlockedUserIds(updated);
        if (user) localStorage.setItem(`nestmate_blocked_${user.id}`, JSON.stringify(updated));
      },

      toggleSavedProperty(property) {
        const isSaved = snapshot.savedProperties.some((item) => item.id === property.id);
        setSnapshot((current) => ({
          ...current,
          savedProperties: isSaved
            ? current.savedProperties.filter((item) => item.id !== property.id)
            : [...current.savedProperties, property]
        }));
        if (supabase && user) {
          if (isSaved) {
            supabase
              .from("property_saves")
              .delete()
              .eq("property_id", property.id)
              .eq("user_id", user.id)
              .then(({ error }) => {
                if (error) console.error("unsave error:", error);
              });
          } else {
            supabase
              .from("property_saves")
              .insert({ property_id: property.id, user_id: user.id })
              .then(({ error }) => {
                if (error) console.error("save error:", error);
              });
          }
        }
      },

      togglePropertyVisibility(propertyId) {
        const property = snapshot.featuredProperties.find((p) => p.id === propertyId);
        setSnapshot((current) => ({
          ...current,
          featuredProperties: current.featuredProperties.map((p) =>
            p.id === propertyId ? { ...p, is_visible: !p.is_visible } : p
          )
        }));
        if (supabase && user && property) {
          supabase
            .from("properties")
            .update({ is_visible: !property.is_visible })
            .eq("id", propertyId)
            .then(({ error }) => {
              if (error) console.error("visibility error:", error);
            });
        }
      },

      async createProperty(data) {
        // Use blob URLs for immediate local preview
        const previewUrls = data.imageFiles.map((f) => URL.createObjectURL(f));

        const optimistic: Property = {
          id: `property-${crypto.randomUUID()}`,
          owner_id: snapshot.profile.id,
          title: data.title,
          description: data.description,
          city: data.city,
          address: data.address,
          rent_price: data.rent_price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          available_to: data.available_to,
          image_urls: previewUrls,
          latitude: 0,
          longitude: 0,
          phone: data.phone,
          email: data.email,
          has_whatsapp: false,
          is_visible: true,
          is_approved: false,
          created_at: new Date().toISOString(),
          owner: snapshot.profile
        };
        setSnapshot((current) => ({
          ...current,
          featuredProperties: [optimistic, ...current.featuredProperties]
        }));

        if (supabase && user) {
          // Upload images to Supabase Storage
          const uploadedUrls: string[] = [];
          for (const file of data.imageFiles) {
            const ext = file.name.split(".").pop() ?? "jpg";
            const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from("property-images")
              .upload(path, file, { upsert: false });
            if (uploadErr) {
              console.error("Image upload failed:", uploadErr.message);
            } else {
              const { data: urlData } = supabase.storage
                .from("property-images")
                .getPublicUrl(path);
              uploadedUrls.push(urlData.publicUrl);
            }
          }

          if (data.imageFiles.length > 0 && uploadedUrls.length === 0) {
            toast.error("Images could not be uploaded. Make sure the 'property-images' storage bucket exists in Supabase and is set to public.");
            setSnapshot((current) => ({
              ...current,
              featuredProperties: current.featuredProperties.filter((p) => p.id !== optimistic.id)
            }));
            return;
          }

          const { data: inserted, error } = await supabase
            .from("properties")
            .insert({
              owner_id: user.id,
              title: data.title,
              description: data.description,
              city: data.city,
              address: data.address,
              rent_price: data.rent_price,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              available_to: data.available_to,
              image_urls: uploadedUrls,
              latitude: 0,
              longitude: 0,
              phone: data.phone,
              email: data.email,
              has_whatsapp: false,
              is_visible: true,
              is_approved: false
            })
            .select()
            .single();

          if (error) {
            console.error("createProperty error:", error);
            toast.error("Could not save property. Please try again.");
            setSnapshot((current) => ({
              ...current,
              featuredProperties: current.featuredProperties.filter((p) => p.id !== optimistic.id)
            }));
            return;
          } else if (inserted) {
            setSnapshot((current) => ({
              ...current,
              featuredProperties: current.featuredProperties.map((p) =>
                p.id === optimistic.id ? { ...inserted as unknown as Property, owner: snapshot.profile } : p
              )
            }));
          }
        }
        toast.success("Property submitted for review.");
      },

      async updateProperty(propertyId, data, imageFiles) {
        // Upload any new image files and replace blob URLs with real Storage URLs
        let finalImageUrls = data.image_urls ?? [];
        if (imageFiles && imageFiles.length > 0 && supabase && user) {
          const uploadedUrls: string[] = [];
          for (const file of imageFiles) {
            const ext = file.name.split(".").pop() ?? "jpg";
            const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from("property-images")
              .upload(path, file, { upsert: false });
            if (uploadErr) {
              console.error("Image upload failed:", uploadErr.message);
            } else {
              const { data: urlData } = supabase.storage
                .from("property-images")
                .getPublicUrl(path);
              uploadedUrls.push(urlData.publicUrl);
            }
          }
          // Keep existing real URLs (non-blob), append newly uploaded URLs
          const existingRealUrls = finalImageUrls.filter((u) => !u.startsWith("blob:"));
          finalImageUrls = [...existingRealUrls, ...uploadedUrls];
        } else if (data.image_urls) {
          // Strip any stale blob URLs even when no new files were provided
          finalImageUrls = data.image_urls.filter((u) => !u.startsWith("blob:"));
        }

        const finalData = { ...data, image_urls: finalImageUrls };

        setSnapshot((current) => ({
          ...current,
          featuredProperties: current.featuredProperties.map((p) =>
            p.id === propertyId ? { ...p, ...finalData } : p
          )
        }));
        if (supabase && user) {
          supabase
            .from("properties")
            .update(finalData)
            .eq("id", propertyId)
            .then(({ error }) => {
              if (error) console.error("updateProperty error:", error);
            });
        }
      },

      deleteProperty(propertyId) {
        setSnapshot((current) => ({
          ...current,
          featuredProperties: current.featuredProperties.filter((p) => p.id !== propertyId)
        }));
        if (supabase && user) {
          supabase
            .from("properties")
            .delete()
            .eq("id", propertyId)
            .then(({ error }) => {
              if (error) console.error("deleteProperty error:", error);
            });
        }
      },

      sendMessage(matchId, content, attachmentUrl, attachmentType) {
        const optimistic: Message = {
          id: `msg-${crypto.randomUUID()}`,
          match_id: matchId,
          sender_id: snapshot.profile.id,
          content,
          read: false,
          created_at: new Date().toISOString(),
          attachment_url: attachmentUrl ?? null,
          attachment_type: attachmentType ?? null,
        };
        setSnapshot((current) => ({
          ...current,
          messages: [...current.messages, optimistic]
        }));
        if (supabase && user) {
          supabase
            .from("messages")
            .insert({
              match_id: matchId,
              sender_id: user.id,
              content,
              attachment_url: attachmentUrl ?? null,
              attachment_type: attachmentType ?? null,
            })
            .select()
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setSnapshot((current) => ({
                  ...current,
                  messages: current.messages.map((m) =>
                    m.id === optimistic.id ? (data as unknown as Message) : m
                  )
                }));
              }
            });
        }
      },

      markMessagesRead(matchId) {
        setSnapshot((current) => ({
          ...current,
          messages: current.messages.map((m) =>
            m.match_id === matchId && m.sender_id !== current.profile.id
              ? { ...m, read: true }
              : m
          )
        }));
        if (supabase && user) {
          supabase
            .from("messages")
            .update({ read: true })
            .eq("match_id", matchId)
            .neq("sender_id", user.id)
            .then(({ error }) => { if (error) console.error("mark messages read error:", error); });
        }
      },

      markNotificationsRead() {
        setSnapshot((current) => ({
          ...current,
          notifications: current.notifications.map((n) => ({ ...n, is_read: true }))
        }));
        if (supabase && user) {
          supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("recipient_id", user.id)
            .then(({ error }) => {
              if (error) console.error("mark read error:", error);
            });
        }
      },

      swipeFlatmate(flatmateId, direction) {
        const matched = snapshot.flatmates.find((item) => item.id === flatmateId) ?? null;
        if (!matched) return null;

        // Check if the other person already liked the current user (mutual = match)
        const isMutual =
          direction === "right" &&
          snapshot.swipes.some(
            (s) =>
              s.swiper_id === matched.user_id &&
              s.swiped_id === snapshot.profile.id &&
              s.direction === "right"
          );

        const newSwipe: Swipe = {
          id: `swipe-${crypto.randomUUID()}`,
          swiper_id: snapshot.profile.id,
          swiped_id: matched.user_id,
          direction,
          created_at: new Date().toISOString()
        };

        if (supabase && user) {
          const myName = snapshot.profile.full_name ?? "Someone";
          supabase
            .from("swipes")
            .upsert(
              { swiper_id: user.id, swiped_id: matched.user_id, direction },
              { onConflict: "swiper_id,swiped_id" }
            )
            .then(({ error }) => {
              if (error) { console.error("swipe error:", error); return; }

              // Always update local swipes
              setSnapshot((current) => ({
                ...current,
                swipes: [...current.swipes, newSwipe]
              }));

              if (direction === "right") {
                if (isMutual) {
                  // Both matched — create match row first, then notify both users with match ID
                  supabase!.from("matches").insert({
                    user_a: user.id,
                    user_b: matched.user_id
                  }).select("id").single().then(({ data: matchRow, error: matchErr }) => {
                    if (matchErr) { console.error("match insert error:", matchErr); return; }
                    const matchedName = matched.profile?.full_name ?? "your new flatmate";
                    void supabase!.from("notifications").insert([
                      {
                        recipient_id: user.id,
                        sender_id: matched.user_id,
                        type: "match",
                        title: "It's a Match!",
                        body: `You matched with ${matchedName}. Tap to start chatting!`,
                        is_read: false
                      },
                      {
                        recipient_id: matched.user_id,
                        sender_id: user.id,
                        type: "match",
                        title: "It's a Match!",
                        body: `You matched with ${myName}. Tap to start chatting!`,
                        is_read: false
                      }
                    ]);
                    // Refresh local notifications + add match to local snapshot
                    void supabase!
                      .from("notifications")
                      .select("*")
                      .eq("recipient_id", user.id)
                      .order("created_at", { ascending: false })
                      .then(({ data }) => {
                        if (data) setSnapshot((c) => ({
                          ...c,
                          notifications: data as unknown as NotificationItem[],
                          matches: matchRow
                            ? [...c.matches, { id: matchRow.id, user_a: user.id, user_b: matched.user_id, created_at: new Date().toISOString() }]
                            : c.matches
                        }));
                      });
                  });
                } else {
                  // One-way like — notify User Y that someone liked them
                  supabase!.from("notifications").insert({
                    recipient_id: matched.user_id,
                    sender_id: user.id,
                    type: "match",
                    title: "Someone likes you!",
                    body: `${myName} swiped right on your profile. Swipe right on theirs to match!`,
                    is_read: false
                  }).then(({ error: ne }) => {
                    if (ne) console.error("like notify error:", ne);
                  });
                }
              }
            });
        } else {
          // Mock fallback (no Supabase)
          setSnapshot((current) => {
            const base = { ...current, swipes: [...current.swipes, newSwipe] };
            if (!isMutual) return base;

            const alreadyMatched = current.matches.some(
              (m) =>
                (m.user_a === current.profile.id && m.user_b === matched.user_id) ||
                (m.user_b === current.profile.id && m.user_a === matched.user_id)
            );
            if (alreadyMatched) return base;

            const notification: NotificationItem = {
              id: `notif-${crypto.randomUUID()}`,
              recipient_id: current.profile.id,
              sender_id: matched.user_id,
              type: "match",
              title: "It's a Match!",
              body: `You matched with ${matched.profile?.full_name ?? "your new flatmate"}. Tap to start chatting!`,
              is_read: false,
              created_at: new Date().toISOString()
            };
            return {
              ...base,
              matches: [
                ...current.matches,
                {
                  id: `match-${crypto.randomUUID()}`,
                  user_a: current.profile.id,
                  user_b: matched.user_id,
                  created_at: new Date().toISOString()
                }
              ],
              notifications: [notification, ...current.notifications]
            };
          });
        }

        // Return matched flatmate only on a mutual match (caller shows the overlay)
        return isMutual ? matched : null;
      },

      approveFlatmate(flatmateId, approved) {
        setSnapshot((current) => ({
          ...current,
          flatmates: current.flatmates.map((f) =>
            f.id === flatmateId ? { ...f, is_approved: approved } : f
          )
        }));
        if (supabase && user) {
          supabase
            .from("flatmate_listings")
            .update({ is_approved: approved })
            .eq("id", flatmateId)
            .then(({ error }) => {
              if (error) console.error("approve flatmate error:", error);
            });
        }
      },

      approveProperty(propertyId, approved) {
        setSnapshot((current) => {
          const property = current.featuredProperties.find((p) => p.id === propertyId);
          const updatedProperties = current.featuredProperties.map((p) =>
            p.id === propertyId ? { ...p, is_approved: approved } : p
          );

          if (!approved || !property) {
            return { ...current, featuredProperties: updatedProperties };
          }

          const notification: NotificationItem = {
            id: `notif-${crypto.randomUUID()}`,
            recipient_id: property.owner_id,
            sender_id: user?.id ?? null,
            type: "property_approved",
            title: "Property Approved!",
            body: `Your listing "${property.title}" has been approved and is now live.`,
            is_read: false,
            created_at: new Date().toISOString()
          };

          return {
            ...current,
            featuredProperties: updatedProperties,
            notifications: [notification, ...current.notifications]
          };
        });

        if (supabase && user) {
          supabase
            .from("properties")
            .update({ is_approved: approved })
            .eq("id", propertyId)
            .then(({ error }) => {
              if (error) console.error("approve property error:", error);
            });

          if (approved) {
            supabase
              .from("properties")
              .select("owner_id, title")
              .eq("id", propertyId)
              .single()
              .then(({ data: prop }) => {
                if (!prop || !supabase) return;
                supabase
                  .from("notifications")
                  .insert({
                    recipient_id: prop.owner_id,
                    sender_id: user.id,
                    type: "property_approved",
                    title: "Property Approved!",
                    body: `Your listing "${prop.title}" has been approved and is now live.`,
                    is_read: false
                  })
                  .then(({ error }) => {
                    if (error) console.error("notify landlord error:", error);
                  });
              });
          }
        }
      },

      async createFlatmateListing(data) {
        if (!user) return;
        const userId = user.id;

        // Upload profile image and apartment images to Storage
        let profileImageUrl = data.profileImageUrl ?? snapshot.profile.avatar_url ?? null;
        let apartmentImages = data.apartmentImages ?? [];

        if (supabase) {
          if (data.profileImageFile) {
            const ext = data.profileImageFile.name.split(".").pop() ?? "jpg";
            const path = `profiles/${userId}/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage
              .from("property-images")
              .upload(path, data.profileImageFile, { upsert: true });
            if (!error) {
              const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
              profileImageUrl = urlData.publicUrl;
            }
          }
          if (data.apartmentImageFiles && data.apartmentImageFiles.length > 0) {
            const uploaded: string[] = [];
            for (const file of data.apartmentImageFiles) {
              const ext = file.name.split(".").pop() ?? "jpg";
              const path = `flats/${userId}/${crypto.randomUUID()}.${ext}`;
              const { error } = await supabase.storage
                .from("property-images")
                .upload(path, file, { upsert: false });
              if (!error) {
                const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
                uploaded.push(urlData.publicUrl);
              }
            }
            if (uploaded.length > 0) apartmentImages = uploaded;
          }
        }

        const newListing: FlatmateListing = {
          id: `flatmate-${crypto.randomUUID()}`,
          user_id: userId,
          bio: data.bio,
          profile_image_url: profileImageUrl,
          min_budget: data.minBudget ?? 0,
          max_budget: data.maxBudget ?? 0,
          preferred_city: data.preferredCity ?? data.flatCity ?? "Nicosia",
          student_type: data.studentType,
          pet_preference: data.petPreference,
          interests: [],
          country_of_origin: data.countryOfOrigin,
          language: data.language,
          housing_status: data.housingStatus,
          flat_price: data.flatPrice ?? null,
          flat_features: data.flatFeatures ?? [],
          flat_area: data.flatArea ?? null,
          flat_postal_code: data.flatPostalCode ?? null,
          apartment_images: apartmentImages,
          apartment_description: data.apartmentDescription ?? null,
          is_approved: true,
          profile: snapshot.profile
        };

        // Persist locally so the form never re-appears on re-login
        localStorage.setItem(`flatmate_submitted_${userId}`, JSON.stringify(newListing));

        setSnapshot((current) => ({
          ...current,
          flatmates: [newListing, ...current.flatmates.filter((f) => f.user_id !== userId)]
        }));
        toast.success("You're live! Browse flatmates and start swiping.");

        if (supabase) {
          supabase
            .from("flatmate_listings")
            .upsert(
              {
                user_id: userId,
                bio: data.bio,
                profile_image_url: profileImageUrl,
                min_budget: data.minBudget ?? 0,
                max_budget: data.maxBudget ?? 0,
                preferred_city: data.preferredCity ?? data.flatCity ?? "Nicosia",
                student_type: data.studentType,
                pet_preference: data.petPreference,
                interests: [],
                country_of_origin: data.countryOfOrigin,
                language: data.language,
                housing_status: data.housingStatus,
                flat_price: data.flatPrice ?? null,
                flat_features: data.flatFeatures ?? [],
                flat_area: data.flatArea ?? null,
                flat_postal_code: data.flatPostalCode ?? null,
                apartment_images: apartmentImages,
                apartment_description: data.apartmentDescription ?? null,
                is_approved: true
              },
              { onConflict: "user_id" }
            )
            .then(({ error }) => {
              if (error) toast.error(`Listing save failed: ${error.message}`);
            });
        }
      },

      async updateProfile(data, avatarFile?) {
        let profileData = { ...data };
        if (supabase && user && avatarFile) {
          const ext = avatarFile.name.split(".").pop() ?? "jpg";
          const path = `avatars/${user.id}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("property-images")
            .upload(path, avatarFile, { upsert: true });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
            profileData = { ...profileData, avatar_url: urlData.publicUrl };
            // Keep flatmate listing in sync
            await supabase.from("flatmate_listings")
              .update({ profile_image_url: urlData.publicUrl })
              .eq("user_id", user.id);
          }
        }
        setSnapshot((current) => ({
          ...current,
          profile: { ...current.profile, ...profileData }
        }));
        if (supabase && user) {
          // Home address is owner-only PII → profiles_private; everything else
          // stays on the world-readable profiles table.
          const { street_address, postal_code, ...publicData } = profileData;
          const updates: PromiseLike<{ error: unknown }>[] = [];
          if (Object.keys(publicData).length > 0) {
            updates.push(
              supabase.from("profiles").update(publicData).eq("id", user.id)
            );
          }
          if ("street_address" in profileData || "postal_code" in profileData) {
            updates.push(
              supabase
                .from("profiles_private")
                .upsert(
                  { id: user.id, street_address, postal_code },
                  { onConflict: "id" }
                )
            );
          }
          const results = await Promise.all(updates);
          const failed = results.find((r) => r.error);
          if (failed) console.error("updateProfile error:", failed.error);
        }
      },

      async submitVerification(idFile, selfieFile) {
        if (supabase && user) {
          const idExt = idFile.name.split(".").pop() ?? "jpg";
          const selfieExt = selfieFile.name.split(".").pop() ?? "jpg";
          const idPath = `${user.id}/id-document.${idExt}`;
          const selfiePath = `${user.id}/selfie.${selfieExt}`;

          const [{ error: idErr }, { error: selfieErr }] = await Promise.all([
            supabase.storage
              .from("verification-docs")
              .upload(idPath, idFile, { upsert: true }),
            supabase.storage
              .from("verification-docs")
              .upload(selfiePath, selfieFile, { upsert: true })
          ]);

          if (idErr || selfieErr) {
            toast.error("Upload failed. Please try again.");
            return;
          }

          const { error: dbErr } = await supabase
            .from("landlord_verifications")
            .upsert(
              {
                landlord_id: user.id,
                id_document_url: idPath,
                selfie_url: selfiePath,
                verification_status: "pending"
              },
              { onConflict: "landlord_id" }
            );

          if (dbErr) {
            toast.error("Could not save verification record. Please try again.");
            return;
          }

          // Generate signed URLs for local display
          const [{ data: idSigned }, { data: selfieSigned }] = await Promise.all([
            supabase.storage.from("verification-docs").createSignedUrl(idPath, 3600),
            supabase.storage
              .from("verification-docs")
              .createSignedUrl(selfiePath, 3600)
          ]);

          const newVerif: LandlordVerification = {
            id: `verif-${crypto.randomUUID()}`,
            landlord_id: user.id,
            id_document_url: idSigned?.signedUrl ?? idPath,
            selfie_url: selfieSigned?.signedUrl ?? selfiePath,
            verification_status: "pending",
            admin_notes: null,
            created_at: new Date().toISOString(),
            reviewed_at: null,
            profile: snapshot.profile
          };

          setSnapshot((current) => ({
            ...current,
            verifications: [
              ...current.verifications.filter((v) => v.landlord_id !== user.id),
              newVerif
            ]
          }));
          toast.success("Documents submitted for review.");
        } else {
          // Mock fallback (no Supabase)
          const newVerif: LandlordVerification = {
            id: `verif-${crypto.randomUUID()}`,
            landlord_id: snapshot.profile.id,
            id_document_url: URL.createObjectURL(idFile),
            selfie_url: URL.createObjectURL(selfieFile),
            verification_status: "pending",
            admin_notes: null,
            created_at: new Date().toISOString(),
            reviewed_at: null,
            profile: snapshot.profile
          };
          setSnapshot((current) => ({
            ...current,
            verifications: [
              ...current.verifications.filter(
                (v) => v.landlord_id !== snapshot.profile.id
              ),
              newVerif
            ]
          }));
          toast.success("Documents submitted for review.");
        }
      },

      approveVerification(landlordId) {
        setSnapshot((current) => ({
          ...current,
          verifications: current.verifications.map((v) =>
            v.landlord_id === landlordId
              ? {
                  ...v,
                  verification_status: "approved",
                  reviewed_at: new Date().toISOString()
                }
              : v
          ),
          profile:
            current.profile.id === landlordId
              ? { ...current.profile, is_verified_landlord: true }
              : current.profile,
          featuredProperties: current.featuredProperties.map((p) =>
            p.owner_id === landlordId && p.owner
              ? { ...p, owner: { ...p.owner, is_verified_landlord: true } }
              : p
          )
        }));

        if (supabase && user) {
          Promise.all([
            supabase
              .from("landlord_verifications")
              .update({
                verification_status: "approved",
                reviewed_at: new Date().toISOString()
              })
              .eq("landlord_id", landlordId),
            supabase
              .from("profiles")
              .update({ is_verified_landlord: true })
              .eq("id", landlordId)
          ]).then(([{ error: ve }, { error: pe }]) => {
            if (ve) console.error("approve verif error:", ve);
            if (pe) console.error("update profile error:", pe);
          });
        }
        toast.success("Landlord verified successfully.");
      },

      async reloadAdminData() {
        if (!supabase) return;
        const [
          { data: propsData },
          { data: flatmatesData },
          { data: verifsData },
          { data: profilesData }
        ] = await Promise.all([
          supabase.from("properties").select("*, owner:profiles!owner_id(*)").order("created_at", { ascending: false }),
          supabase.from("flatmate_listings").select("*, profile:profiles!user_id(*)"),
          supabase.from("landlord_verifications").select("*, profile:profiles!landlord_id(*)"),
          supabase.from("profiles").select("*").order("created_at", { ascending: false })
        ]);

        const verificationsWithUrls = await Promise.all(
          (verifsData ?? []).map(async (v: Record<string, unknown>) => {
            try {
              const [{ data: idSigned }, { data: selfieSigned }] = await Promise.all([
                supabase!.storage.from("verification-docs").createSignedUrl(v.id_document_url as string, 3600),
                supabase!.storage.from("verification-docs").createSignedUrl(v.selfie_url as string, 3600)
              ]);
              return { ...v, id_document_url: idSigned?.signedUrl ?? v.id_document_url, selfie_url: selfieSigned?.signedUrl ?? v.selfie_url };
            } catch { return v; }
          })
        );

        const props = (propsData ?? []) as unknown as Property[];
        setSnapshot((current) => ({
          ...current,
          featuredProperties: props,
          flatmates: (flatmatesData ?? []) as unknown as FlatmateListing[],
          verifications: verificationsWithUrls as unknown as LandlordVerification[],
          stats: {
            ...current.stats,
            totalProperties: props.length,
            activeListings: props.filter((p) => p.is_approved && p.is_visible).length
          }
        }));
        if (profilesData) {
          setAllProfiles(profilesData as Profile[]);
          setSnapshot((current) => ({ ...current, stats: { ...current.stats, totalUsers: profilesData.length } }));
        }
      },

      async adminDeleteAccount(userId) {
        setAllProfiles((current) => current.filter((p) => p.id !== userId));
        setSnapshot((current) => ({
          ...current,
          featuredProperties: current.featuredProperties.filter((p) => p.owner_id !== userId),
          flatmates: current.flatmates.filter((f) => f.user_id !== userId),
          verifications: current.verifications.filter((v) => v.landlord_id !== userId)
        }));
        if (supabase) {
          const { error } = await supabase.from("profiles").delete().eq("id", userId);
          if (error) console.error("adminDeleteAccount error:", error);
        }
        toast.success("Account deleted.");
      },

      adminDeleteFlatmate(flatmateId) {
        setSnapshot((current) => ({
          ...current,
          flatmates: current.flatmates.filter((f) => f.id !== flatmateId)
        }));
        if (supabase) {
          supabase
            .from("flatmate_listings")
            .delete()
            .eq("id", flatmateId)
            .then(({ error }) => {
              if (error) console.error("adminDeleteFlatmate error:", error);
            });
        }
        toast.success("Listing removed.");
      },

      rejectVerification(landlordId, reason) {
        setSnapshot((current) => ({
          ...current,
          verifications: current.verifications.map((v) =>
            v.landlord_id === landlordId
              ? {
                  ...v,
                  verification_status: "rejected",
                  admin_notes: reason,
                  reviewed_at: new Date().toISOString()
                }
              : v
          )
        }));

        if (supabase && user) {
          supabase
            .from("landlord_verifications")
            .update({
              verification_status: "rejected",
              admin_notes: reason,
              reviewed_at: new Date().toISOString()
            })
            .eq("landlord_id", landlordId)
            .then(({ error }) => {
              if (error) console.error("reject verif error:", error);
            });
        }
        toast.success("Verification rejected.");
      },

      async reloadData() {
        if (!user) return;
        setDataLoading(true);
        await loadFromSupabase(user.id).finally(() => setDataLoading(false));
      },

      myFlatmateListing,
      dataLoading,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allProfiles, blockedUserIds, dataLoading, filteredFlatmates, filteredProperties, flatmateFilters, myFlatmateListing, propertyFilters, snapshot, user]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
