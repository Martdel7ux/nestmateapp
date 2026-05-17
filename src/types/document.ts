export type DocumentCategory =
  | 'lease'
  | 'deposit_receipt'
  | 'utility_bill'
  | 'rent_receipt'
  | 'insurance'
  | 'university_id'
  | 'residence_permit'
  | 'visa'
  | 'passport'
  | 'bank_statement'
  | 'medical'
  | 'tax'
  | 'other';

export type DocumentVisibility = 'private' | 'household';
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export type DocumentAccessAction = 'view' | 'download' | 'share' | 'delete' | 'restore';

export interface Document {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  storage_path: string;
  mime_type: string;
  file_size: number;
  page_count?: number | null;
  thumbnail_path?: string | null;
  ocr_text?: string | null;
  ocr_status: OcrStatus;
  issued_date?: string | null;
  expires_at?: string | null;
  expiry_reminded_30?: string | null;
  expiry_reminded_14?: string | null;
  expiry_reminded_3?: string | null;
  visibility: DocumentVisibility;
  shared_household_id?: string | null;
  related_rent_agreement_id?: string | null;
  related_property_id?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  accessed_by: string;
  action: DocumentAccessAction;
  user_agent?: string | null;
  accessed_at: string;
}

export interface DocumentShareToken {
  id: string;
  token: string;
  document_id: string;
  shared_by: string;
  password_hash?: string | null;
  expires_at: string;
  download_count: number;
  max_downloads?: number | null;
  created_at: string;
  revoked_at?: string | null;
}

export interface DocumentUploadForm {
  title: string;
  description?: string;
  category: DocumentCategory;
  issued_date?: string;
  expires_at?: string;
  tags: string[];
  visibility: DocumentVisibility;
  shared_household_id?: string;
  related_rent_agreement_id?: string;
  file: File;
}

export interface DocumentEditForm {
  title: string;
  description?: string;
  category: DocumentCategory;
  issued_date?: string;
  expires_at?: string;
  tags: string[];
  visibility: DocumentVisibility;
  shared_household_id?: string;
}

export interface DocumentFilters {
  category?: DocumentCategory;
  visibility?: DocumentVisibility;
  search?: string;
  expiringWithinDays?: number;
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  lease:             'Lease',
  deposit_receipt:   'Deposit',
  utility_bill:      'Utility Bill',
  rent_receipt:      'Rent Receipt',
  insurance:         'Insurance',
  university_id:     'University ID',
  residence_permit:  'Residence Permit',
  visa:              'Visa',
  passport:          'Passport',
  bank_statement:    'Bank Statement',
  medical:           'Medical',
  tax:               'Tax',
  other:             'Other',
};

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  lease:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deposit_receipt:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  utility_bill:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rent_receipt:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  insurance:         'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  university_id:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  residence_permit:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  visa:              'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  passport:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  bank_statement:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medical:           'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  tax:               'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  other:             'bg-muted text-muted-foreground',
};
