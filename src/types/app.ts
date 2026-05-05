import type {
  FlatmateListing,
  LandlordVerification,
  Match,
  Message,
  NotificationItem,
  Profile,
  Property,
  PropertyReview
} from "@/types/supabase";

export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalMatches: number;
  activeListings: number;
}

export interface AppSnapshot {
  profile: Profile;
  featuredProperties: Property[];
  savedProperties: Property[];
  reviews: PropertyReview[];
  flatmates: FlatmateListing[];
  matches: Match[];
  messages: Message[];
  notifications: NotificationItem[];
  verifications: LandlordVerification[];
  stats: DashboardStats;
}
