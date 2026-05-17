export const CYPRUS_UNIVERSITIES = [
  { value: "unic",      label: "University of Nicosia (UNIC)" },
  { value: "ucy",       label: "University of Cyprus (UCY)" },
  { value: "cut",       label: "Cyprus University of Technology (CUT)" },
  { value: "euc",       label: "European University Cyprus (EUC)" },
  { value: "frederick", label: "Frederick University" },
  { value: "neapolis",  label: "Neapolis University Pafos" },
  { value: "open",      label: "Open University of Cyprus" },
  { value: "uclan",     label: "UCLan Cyprus" },
  { value: "other",     label: "Other / Not a student" },
] as const;

export type UniversityValue = (typeof CYPRUS_UNIVERSITIES)[number]["value"];
