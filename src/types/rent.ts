export type RentScope          = 'personal' | 'household';
export type RentPaymentStatus  = 'upcoming' | 'reminded' | 'due_today' | 'paid' | 'late' | 'skipped';
export type RentPaymentMethod  = 'bank_transfer' | 'revolut' | 'cash' | 'cheque' | 'other';
export type RentReminderChannel = 'in_app' | 'push' | 'email';

export interface RentAgreement {
  id: string;
  user_id: string;
  household_id?: string | null;
  amount: number;
  currency: string;
  due_day: number;
  first_payment_date: string;
  end_date?: string | null;
  scope: RentScope;
  landlord_name?: string | null;
  landlord_phone?: string | null;
  landlord_email?: string | null;
  landlord_whatsapp?: string | null;
  landlord_user_id?: string | null;
  property_id?: string | null;
  payment_method?: RentPaymentMethod | null;
  payment_details?: string | null;
  reminder_days_before: number;
  reminder_followup_on_due_day: boolean;
  reminder_channels: RentReminderChannel[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RentPayment {
  id: string;
  agreement_id: string;
  due_date: string;
  amount: number;
  currency: string;
  status: RentPaymentStatus;
  paid_at?: string | null;
  paid_method?: string | null;
  receipt_url?: string | null;
  reminded_at?: string | null;
  followup_sent_at?: string | null;
  notes?: string | null;
  created_at: string;
  // joined
  rent_agreements?: Pick<RentAgreement,
    'landlord_name' | 'landlord_phone' | 'landlord_email' |
    'landlord_whatsapp' | 'payment_method' | 'payment_details' |
    'household_id' | 'scope' | 'user_id'
  >;
}

// Form types
export interface RentAgreementFormData {
  amount: string;
  currency: string;
  due_day: string;
  first_payment_date: string;
  end_date?: string;
  open_ended: boolean;
  scope: RentScope;
  household_id?: string;
  landlord_name?: string;
  landlord_phone?: string;
  landlord_email?: string;
  landlord_whatsapp?: string;
  payment_method?: RentPaymentMethod;
  payment_details?: string;
  reminder_days_before: number;
  reminder_followup_on_due_day: boolean;
  reminder_channels: RentReminderChannel[];
}

export interface MarkPaidFormData {
  paid_at: string;
  paid_method?: string;
  notes?: string;
}
