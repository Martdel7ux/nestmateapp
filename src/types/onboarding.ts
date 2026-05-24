export type OnboardingUserType =
  | "student_housing"
  | "student_flatmates"
  | "student_tools"
  | "landlord";

export interface StudentPreferences {
  university?: string;
  city?: string;
  budget?: string;
  hasPlace?: boolean;
  bedroomsAvailable?: string;
  rentPerPerson?: string;
}

export interface LandlordPreferences {
  propertyCount?: string;
  location?: string;
}

export interface OnboardingData {
  userType?: OnboardingUserType;
  studentPreferences?: StudentPreferences;
  landlordPreferences?: LandlordPreferences;
  completedAt?: string;
}
