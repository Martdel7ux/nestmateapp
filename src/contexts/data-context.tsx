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
  StudentType
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
  flatFeatures?: string[];
  apartmentDescription?: string;
  profileImageUrl?: string;
  apartmentImages?: string[];
}

interface DataContextValue {
  snapshot: AppSnapshot;
  propertyFilters: SearchFilters;
  flatmateFilters: FlatmateFilters;
  setPropertyFilters: (filters: SearchFilters) => void;
  setFlatmateFilters: (filters: FlatmateFilters) => void;
  filteredProperties: Property[];
  filteredFlatmates: FlatmateListing[];
  toggleSavedProperty: (property: Property) => void;
  togglePropertyVisibility: (propertyId: string) => void;
  sendMessage: (matchId: string, content: string) => void;
  markNotificationsRead: () => void;
  swipeFlatmate: (flatmateId: string, direction: "left" | "right") => FlatmateListing | null;
  approveFlatmate: (flatmateId: string, approved: boolean) => void;
  approveProperty: (propertyId: string, approved: boolean) => void;
  createFlatmateListing: (data: CreateFlatmateInput) => void;
  updateProfile: (data: Partial<Pick<Profile, "full_name" | "bio" | "university" | "city" | "avatar_url">>) => Promise<void>;
  submitVerification: (idFile: File, selfieFile: File) => Promise<void>;
  approveVerification: (landlordId: string) => void;
  rejectVerification: (landlordId: string, reason: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile: authProfile } = useAuth();
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() => seedSnapshot);
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
    void loadFromSupabase(user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadFromSupabase(userId: string) {
    if (!supabase) return;
    try {
      const [
        { data: propsData },
        { data: flatmatesData },
        { data: matchesData },
        { data: notifsData },
        { data: verifsData },
        { data: savesData }
      ] = await Promise.all([
        supabase
          .from("properties")
          .select("*, owner:profiles!owner_id(*)")
          .order("created_at", { ascending: false }),
        supabase.from("flatmate_listings").select("*, profile:profiles!user_id(*)"),
        supabase
          .from("matches")
          .select("*")
          .or(`user_a.eq.${userId},user_b.eq.${userId}`),
        supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("landlord_verifications")
          .select("*, profile:profiles!landlord_id(*)"),
        supabase.from("property_saves").select("property_id").eq("user_id", userId)
      ]);

      const matchIds = (matchesData ?? []).map((m: Record<string, string>) => m.id);
      const { data: msgsData } =
        matchIds.length > 0
          ? await supabase
              .from("messages")
              .select("*")
              .in("match_id", matchIds)
              .order("created_at", { ascending: true })
          : { data: [] };

      // Generate signed URLs so verification doc images display correctly (private bucket)
      const verificationsWithUrls = await Promise.all(
        (verifsData ?? []).map(async (v: Record<string, unknown>) => {
          try {
            const [{ data: idSigned }, { data: selfieSigned }] = await Promise.all([
              supabase!.storage
                .from("verification-docs")
                .createSignedUrl(v.id_document_url as string, 3600),
              supabase!.storage
                .from("verification-docs")
                .createSignedUrl(v.selfie_url as string, 3600)
            ]);
            return {
              ...v,
              id_document_url: idSigned?.signedUrl ?? v.id_document_url,
              selfie_url: selfieSigned?.signedUrl ?? v.selfie_url
            };
          } catch {
            return v;
          }
        })
      );

      const savedIds = new Set(
        (savesData ?? []).map((s: Record<string, string>) => s.property_id)
      );
      const savedProps = (propsData ?? []).filter((p: Record<string, string>) =>
        savedIds.has(p.id)
      );

      setSnapshot((current) => ({
        ...current,
        featuredProperties: (propsData ?? []) as unknown as Property[],
        savedProperties: savedProps as unknown as Property[],
        flatmates: (flatmatesData ?? []) as unknown as FlatmateListing[],
        matches: (matchesData ?? []) as AppSnapshot["matches"],
        messages: (msgsData ?? []) as unknown as Message[],
        notifications: (notifsData ?? []) as unknown as NotificationItem[],
        verifications: verificationsWithUrls as unknown as LandlordVerification[]
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

  const filteredFlatmates = useMemo(() => {
    return snapshot.flatmates.filter((flatmate) => {
      if (!flatmate.is_approved) return false;
      if (flatmate.user_id === snapshot.profile.id) return false;
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
      if (snapshot.profile.user_type === "student") {
        return flatmate.housing_status !== "seeking_flat";
      }
      return true;
    });
  }, [flatmateFilters, snapshot.flatmates, snapshot.profile]);

  const value = useMemo<DataContextValue>(
    () => ({
      snapshot,
      propertyFilters,
      flatmateFilters,
      setPropertyFilters,
      setFlatmateFilters,
      filteredProperties,
      filteredFlatmates,

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

      sendMessage(matchId, content) {
        const optimistic: Message = {
          id: `msg-${crypto.randomUUID()}`,
          match_id: matchId,
          sender_id: snapshot.profile.id,
          content,
          read: false,
          created_at: new Date().toISOString()
        };
        setSnapshot((current) => ({
          ...current,
          messages: [...current.messages, optimistic]
        }));
        if (supabase && user) {
          supabase
            .from("messages")
            .insert({ match_id: matchId, sender_id: user.id, content })
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

        if (supabase && user && matched) {
          supabase
            .from("swipes")
            .upsert(
              { swiper_id: user.id, swiped_id: matched.user_id, direction },
              { onConflict: "swiper_id,swiped_id" }
            )
            .then(({ error }) => {
              if (error) {
                console.error("swipe error:", error);
                return;
              }
              if (direction === "right") {
                // DB trigger creates the match — refetch to pick it up
                Promise.all([
                  supabase!
                    .from("matches")
                    .select("*")
                    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
                  supabase!
                    .from("notifications")
                    .select("*")
                    .eq("recipient_id", user.id)
                    .order("created_at", { ascending: false })
                ]).then(([{ data: newMatches }, { data: newNotifs }]) => {
                  setSnapshot((current) => {
                    const prevCount = current.matches.length;
                    const nextCount = (newMatches ?? []).length;
                    if (nextCount > prevCount) toast.success("It's a Match!");
                    return {
                      ...current,
                      matches: (newMatches ?? []) as AppSnapshot["matches"],
                      notifications: (newNotifs ?? []) as unknown as NotificationItem[]
                    };
                  });
                });
              }
            });
        } else if (direction === "right" && matched) {
          // Mock fallback (no Supabase)
          const alreadyMatched = snapshot.matches.some(
            (m) => m.user_b === matched.user_id
          );
          if (!alreadyMatched) {
            const notification: NotificationItem = {
              id: `notif-${crypto.randomUUID()}`,
              recipient_id: snapshot.profile.id,
              sender_id: matched.user_id,
              type: "match",
              title: "It's a Match!",
              body: `You and ${matched.profile?.full_name ?? "a new flatmate"} can now chat.`,
              is_read: false,
              created_at: new Date().toISOString()
            };
            setSnapshot((current) => ({
              ...current,
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
            }));
            toast.success("It's a Match!");
          }
        }

        return matched;
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
        setSnapshot((current) => ({
          ...current,
          featuredProperties: current.featuredProperties.map((p) =>
            p.id === propertyId ? { ...p, is_approved: approved } : p
          )
        }));
        if (supabase && user) {
          supabase
            .from("properties")
            .update({ is_approved: approved })
            .eq("id", propertyId)
            .then(({ error }) => {
              if (error) console.error("approve property error:", error);
            });
        }
      },

      createFlatmateListing(data) {
        const newListing: FlatmateListing = {
          id: `flatmate-${crypto.randomUUID()}`,
          user_id: snapshot.profile.id,
          bio: data.bio,
          profile_image_url: data.profileImageUrl ?? snapshot.profile.avatar_url ?? null,
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
          apartment_images: data.apartmentImages ?? [],
          apartment_description: data.apartmentDescription ?? null,
          is_approved: false,
          profile: snapshot.profile
        };
        setSnapshot((current) => ({
          ...current,
          flatmates: [...current.flatmates, newListing]
        }));
        toast.success("Listing submitted — pending admin approval.");

        if (supabase && user) {
          supabase
            .from("flatmate_listings")
            .upsert(
              {
                user_id: user.id,
                bio: data.bio,
                profile_image_url: data.profileImageUrl ?? snapshot.profile.avatar_url ?? null,
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
                apartment_images: data.apartmentImages ?? [],
                apartment_description: data.apartmentDescription ?? null,
                is_approved: false
              },
              { onConflict: "user_id" }
            )
            .then(({ error }) => {
              if (error) console.error("create flatmate listing error:", error);
            });
        }
      },

      async updateProfile(data) {
        setSnapshot((current) => ({
          ...current,
          profile: { ...current.profile, ...data }
        }));
        if (supabase && user) {
          const { error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", user.id);
          if (error) console.error("updateProfile error:", error);
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
      }
    }),
    [filteredFlatmates, filteredProperties, flatmateFilters, propertyFilters, snapshot, user]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
