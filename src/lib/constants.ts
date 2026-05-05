export const cities = [
  "Nicosia",
  "Limassol",
  "Larnaca",
  "Paphos",
  "Famagusta",
  "Kyrenia"
] as const;

export const studentTypes = ["erasmus", "full_time"] as const;
export const userTypes = ["student", "landlord"] as const;

export const universityCoordinates: Record<
  string,
  { lat: number; lng: number; city: (typeof cities)[number] }
> = {
  "University of Cyprus": { lat: 35.1441, lng: 33.4081, city: "Nicosia" },
  "Cyprus University of Technology": {
    lat: 34.6778,
    lng: 33.043,
    city: "Limassol"
  },
  UCLan: { lat: 35.0362, lng: 33.9503, city: "Larnaca" },
  "Frederick University": { lat: 35.1266, lng: 33.3374, city: "Nicosia" }
};

export const bottomNav = [
  { label: "Home", path: "/", icon: "Home" },
  { label: "Flatmates", path: "/flatmates", icon: "HeartHandshake" },
  { label: "Messages", path: "/messages", icon: "MessageCircle" },
  { label: "Profile", path: "/profile", icon: "UserRound" }
] as const;
