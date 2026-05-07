import { cities, studentTypes, userTypes } from "@/lib/constants";

export type City = (typeof cities)[number];
export type StudentType = (typeof studentTypes)[number];
export type UserType = (typeof userTypes)[number];
export type Role = "admin" | "moderator";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  city?: City | null;
  university?: string | null;
  user_type: UserType;
  is_verified_landlord: boolean;
  accepted_terms_at?: string | null;
  accepted_privacy_at?: string | null;
  accepted_cookies_at?: string | null;
  created_at?: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  city: City;
  address: string;
  rent_price: number;
  bedrooms: number;
  bathrooms: number;
  available_to: StudentType;
  image_urls: string[];
  latitude: number;
  longitude: number;
  phone?: string | null;
  email?: string | null;
  has_whatsapp: boolean;
  is_visible: boolean;
  is_approved: boolean;
  created_at: string;
  owner?: Profile;
  views_count?: number;
  average_rating?: number | null;
}

export interface PropertyReview {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: Profile;
}

export interface FlatmateListing {
  id: string;
  user_id: string;
  bio: string;
  profile_image_url?: string | null;
  min_budget: number;
  max_budget: number;
  preferred_city: City;
  student_type: StudentType;
  pet_preference: "love" | "okay" | "neutral" | "no";
  interests: string[];
  country_of_origin: string;
  language: string;
  housing_status: "has_flat" | "seeking_flat";
  flat_price?: number | null;
  flat_features?: string[] | null;
  flat_area?: string | null;
  flat_postal_code?: string | null;
  apartment_images: string[];
  apartment_description?: string | null;
  is_approved: boolean;
  profile?: Profile;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  other_profile?: FlatmateListing;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  direction: "left" | "right";
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  attachment_url?: string | null;
}

export interface LandlordVerification {
  id: string;
  landlord_id: string;
  id_document_url: string;
  selfie_url: string;
  verification_status: VerificationStatus;
  admin_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  profile?: Profile;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  sender_id?: string | null;
  type:
    | "match"
    | "message"
    | "saved_property"
    | "verification"
    | "report"
    | "system";
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
