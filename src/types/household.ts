export type HouseholdRole = 'owner' | 'admin' | 'member';
export type SplitMethod  = 'equal' | 'shares' | 'custom';
export type ExpenseCategory = 'utilities' | 'groceries' | 'rent' | 'internet' | 'cleaning' | 'other';
export type SettlementMethod = 'cash' | 'revolut' | 'bank_transfer' | 'other';
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Household {
  id: string;
  name: string;
  property_id?: string | null;
  address?: string | null;
  currency: string;
  invite_code: string;
  invite_expires_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  display_name?: string | null;
  joined_at: string;
  left_at?: string | null;
  // joined from profiles
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface Expense {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  currency: string;
  category?: ExpenseCategory | null;
  paid_by: string;
  paid_at: string;
  split_method: SplitMethod;
  receipt_url?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // joined
  shares?: ExpenseShare[];
  payer?: { full_name: string | null; avatar_url: string | null };
}

export interface ExpenseShare {
  expense_id: string;
  user_id: string;
  amount: number;
  share_weight?: number | null;
}

export interface Settlement {
  id: string;
  household_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  method?: SettlementMethod | null;
  note?: string | null;
  settled_at: string;
  created_by: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  inviter_id?: string | null;
  invitee_email?: string | null;
  invitee_user_id?: string | null;
  status: InviteStatus;
  created_at: string;
  responded_at?: string | null;
  expires_at?: string | null;
}

export interface HouseholdBalance {
  household_id: string;
  user_id: string;
  balance: number;
}

// Derived types for UI
export interface MemberBalance {
  member: HouseholdMember;
  balance: number; // positive = owed to me, negative = I owe them
}

export interface SettleSuggestion {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

export interface HouseholdWithMembers extends Household {
  members: HouseholdMember[];
}

// Form input types
export interface ExpenseFormData {
  description: string;
  amount: string;
  paid_by: string;
  paid_at: string;
  split_method: SplitMethod;
  category?: ExpenseCategory;
  notes?: string;
  participant_ids: string[];
  custom_shares?: Record<string, string>; // user_id -> amount string
  share_weights?: Record<string, string>; // user_id -> weight string
}

export interface SettlementFormData {
  from_user_id: string;
  to_user_id: string;
  amount: string;
  method?: SettlementMethod;
  note?: string;
  settled_at: string;
}
