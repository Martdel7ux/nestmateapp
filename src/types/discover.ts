export type OpportunityType = "event" | "job" | "internship" | "volunteering";
export type OppLocationType = "in_person" | "remote" | "hybrid";
export type OppEmploymentType = "full_time" | "part_time" | "contract" | "internship" | "volunteer";
export type OppNotifyFrequency = "instant" | "daily" | "weekly";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description?: string | null;
  organization?: string | null;
  location?: string | null;
  location_type?: OppLocationType | null;
  url?: string | null;
  image_url?: string | null;
  source?: string | null;
  source_id?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  employment_type?: OppEmploymentType | null;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  is_saved?: boolean;
}

export interface UserOpportunityPreferences {
  user_id: string;
  interested_types: OpportunityType[];
  interested_tags: string[];
  location?: string | null;
  remote_ok: boolean;
  notify_email: boolean;
  notify_inapp: boolean;
  notify_frequency: OppNotifyFrequency;
  updated_at?: string;
}

export interface DiscoverNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  opportunity_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface OpportunityFilters {
  type?: OpportunityType | null;
  query?: string;
  location_type?: OppLocationType | null;
  tags?: string[];
}
