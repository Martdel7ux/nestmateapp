import type { AppSnapshot } from "@/types/app";

export const seedSnapshot: AppSnapshot = {
  profile: {
    id: "user-1",
    full_name: "Maya Demetriou",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "Economics student who loves calm spaces, sea swims, and well-organized kitchens.",
    city: "Nicosia",
    university: "University of Cyprus",
    user_type: "student",
    is_verified_landlord: false,
    accepted_terms_at: new Date().toISOString(),
    accepted_privacy_at: new Date().toISOString(),
    accepted_cookies_at: new Date().toISOString()
  },
  featuredProperties: [
    {
      id: "property-1",
      owner_id: "user-1",
      title: "Sunlit studio near campus",
      description:
        "Walkable to lectures, fully furnished, with a shaded balcony and all bills bundled into one easy payment.",
      city: "Nicosia",
      address: "Aglantzia, Nicosia",
      rent_price: 540,
      bedrooms: 1,
      bathrooms: 1,
      available_to: "erasmus",
      image_urls: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
      ],
      latitude: 35.1425,
      longitude: 33.4103,
      phone: "+357 99 123456",
      email: "host@nestmate.app",
      has_whatsapp: true,
      is_visible: true,
      is_approved: true,
      created_at: "2026-04-08T09:30:00.000Z",
      views_count: 124,
      average_rating: 4.8,
      owner: {
        id: "landlord-1",
        full_name: "Andreas Christou",
        bio: "Responsive landlord focused on safe, student-friendly rentals.",
        city: "Nicosia",
        user_type: "landlord",
        is_verified_landlord: true
      }
    },
    {
      id: "property-2",
      owner_id: "landlord-2",
      title: "Two-bedroom apartment with study nook",
      description:
        "A premium Limassol option with modern interiors, a shared rooftop, and quick access to bus routes for Cyprus Tech.",
      city: "Limassol",
      address: "Mesa Geitonia, Limassol",
      rent_price: 890,
      bedrooms: 2,
      bathrooms: 2,
      available_to: "full_time",
      image_urls: [
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
      ],
      latitude: 34.7005,
      longitude: 33.0314,
      phone: "+357 96 222222",
      email: "limassol@nestmate.app",
      has_whatsapp: false,
      is_visible: true,
      is_approved: true,
      created_at: "2026-04-10T16:15:00.000Z",
      views_count: 89,
      average_rating: 4.5,
      owner: {
        id: "landlord-2",
        full_name: "Elena Ioannou",
        bio: "Boutique landlord with flexible move-in dates for international students.",
        city: "Limassol",
        user_type: "landlord",
        is_verified_landlord: true
      }
    },
    {
      id: "property-3",
      owner_id: "landlord-3",
      title: "Budget flat with sea breeze",
      description:
        "Affordable shared apartment in Larnaca with fast wifi, laundry, and a quiet building popular with exchange students.",
      city: "Larnaca",
      address: "Skala, Larnaca",
      rent_price: 430,
      bedrooms: 1,
      bathrooms: 1,
      available_to: "erasmus",
      image_urls: [
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80"
      ],
      latitude: 34.9117,
      longitude: 33.6363,
      phone: "+357 97 444444",
      email: "sea@nestmate.app",
      has_whatsapp: true,
      is_visible: true,
      is_approved: true,
      created_at: "2026-04-11T12:45:00.000Z",
      views_count: 64,
      average_rating: 4.3,
      owner: {
        id: "landlord-3",
        full_name: "Petros Antoniou",
        bio: "Larnaca host offering simple, well-kept student accommodation.",
        city: "Larnaca",
        user_type: "landlord",
        is_verified_landlord: false
      }
    }
  ],
  savedProperties: [],
  reviews: [
    {
      id: "review-1",
      property_id: "property-1",
      user_id: "user-2",
      rating: 5,
      comment: "Great light, safe area, and the landlord answered within minutes.",
      created_at: "2026-04-11T10:00:00.000Z",
      user: {
        id: "user-2",
        full_name: "Luca Moretti",
        user_type: "student",
        city: "Nicosia",
        is_verified_landlord: false
      }
    }
  ],
  flatmates: [
    {
      id: "flatmate-0",
      user_id: "user-1",
      bio: "Economics student who loves calm spaces, sea swims, and well-organized kitchens. Looking for a quiet, respectful flatmate.",
      profile_image_url:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      min_budget: 350,
      max_budget: 600,
      preferred_city: "Nicosia",
      student_type: "full_time",
      pet_preference: "okay",
      interests: ["Swimming", "Cooking", "Economics"],
      country_of_origin: "Cyprus",
      language: "English",
      housing_status: "seeking_flat",
      flat_price: null,
      flat_features: [],
      apartment_images: [],
      apartment_description: null,
      is_approved: true,
      profile: {
        id: "user-1",
        full_name: "Maya Demetriou",
        avatar_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        city: "Nicosia",
        user_type: "student",
        university: "University of Cyprus",
        is_verified_landlord: false
      }
    },
    {
      id: "flatmate-1",
      user_id: "user-3",
      bio: "Architecture student, clean routine, likes dinners with friends and quiet mornings.",
      profile_image_url:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      min_budget: 350,
      max_budget: 550,
      preferred_city: "Nicosia",
      student_type: "full_time",
      pet_preference: "okay",
      interests: ["Gym", "Design", "Cooking"],
      country_of_origin: "Italy",
      language: "Italian",
      housing_status: "seeking_flat",
      apartment_images: [],
      apartment_description: null,
      is_approved: true,
      profile: {
        id: "user-3",
        full_name: "Marco Bellini",
        city: "Nicosia",
        user_type: "student",
        university: "University of Cyprus",
        is_verified_landlord: false
      }
    },
    {
      id: "flatmate-3",
      user_id: "user-5",
      bio: "Third-year Business student with a spacious two-bedroom flat near UCLan Cyprus. Looking for a tidy, respectful flatmate to share bills and good vibes.",
      profile_image_url:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      min_budget: 300,
      max_budget: 500,
      preferred_city: "Larnaca",
      student_type: "full_time",
      pet_preference: "no",
      interests: ["Football", "Gaming", "Business"],
      country_of_origin: "Nigeria",
      language: "English",
      housing_status: "has_flat",
      flat_price: 450,
      flat_features: ["WiFi", "Furnished", "Bills Included", "Washing Machine"],
      apartment_images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
      ],
      apartment_description: "Modern furnished room in a quiet building, 10 minutes walk from campus. All bills included.",
      is_approved: true,
      profile: {
        id: "user-5",
        full_name: "Chidi Okafor",
        city: "Larnaca",
        user_type: "student",
        university: "UCLan Cyprus",
        is_verified_landlord: false
      }
    },
    {
      id: "flatmate-2",
      user_id: "user-4",
      bio: "Master's student with a bright two-bedroom flat, searching for one more calm roommate.",
      profile_image_url:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      min_budget: 400,
      max_budget: 620,
      preferred_city: "Limassol",
      student_type: "erasmus",
      pet_preference: "love",
      interests: ["Beach", "Languages", "Pilates"],
      country_of_origin: "Greece",
      language: "Greek",
      housing_status: "has_flat",
      apartment_images: [
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
      ],
      apartment_description: "Ensuite room available from May with balcony views.",
      is_approved: true,
      profile: {
        id: "user-4",
        full_name: "Nefeli Kosta",
        city: "Limassol",
        user_type: "student",
        university: "Cyprus University of Technology",
        is_verified_landlord: false
      }
    }
  ],
  swipes: [
    {
      id: "swipe-seed-1",
      swiper_id: "user-4",
      swiped_id: "user-1",
      direction: "right" as const,
      created_at: "2026-04-12T10:00:00.000Z"
    },
    {
      id: "swipe-seed-2",
      swiper_id: "user-5",
      swiped_id: "user-1",
      direction: "right" as const,
      created_at: "2026-04-12T11:00:00.000Z"
    }
  ],
  matches: [
    {
      id: "match-1",
      user_a: "user-1",
      user_b: "user-4",
      created_at: "2026-04-12T13:00:00.000Z"
    },
    {
      id: "match-2",
      user_a: "user-1",
      user_b: "user-5",
      created_at: "2026-04-13T09:00:00.000Z"
    }
  ],
  messages: [
    {
      id: "msg-1",
      match_id: "match-1",
      sender_id: "user-4",
      content: "Hi Maya, the spare room is still open if you want a video tour tonight.",
      read: false,
      created_at: "2026-04-12T13:10:00.000Z"
    },
    {
      id: "msg-2",
      match_id: "match-1",
      sender_id: "user-1",
      content: "That sounds great. Could we do 7pm Cyprus time?",
      read: true,
      created_at: "2026-04-12T13:15:00.000Z"
    },
    {
      id: "msg-3",
      match_id: "match-2",
      sender_id: "user-5",
      content: "Hey! Saw your profile, I think we'd be a great match. The room is still available.",
      read: false,
      created_at: "2026-04-13T09:30:00.000Z"
    }
  ],
  notifications: [
    {
      id: "notif-1",
      recipient_id: "user-1",
      sender_id: "user-4",
      type: "match",
      title: "New match request! 🎉",
      body: "Nefeli Papadaki wants to match with you. Check out her profile and start chatting.",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: "notif-3",
      recipient_id: "user-1",
      sender_id: "user-3",
      type: "match",
      title: "Someone liked your listing 👀",
      body: "Marco Bellini swiped right on your flatmate profile. Like him back to connect!",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: "notif-4",
      recipient_id: "user-1",
      sender_id: "user-4",
      type: "message",
      title: "New message from Nefeli",
      body: "Hey! I saw your profile and I think we'd be great flatmates. Are you still looking?",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    },
    {
      id: "notif-5",
      recipient_id: "user-1",
      sender_id: null,
      type: "system",
      title: "Profile approved ✅",
      body: "Your flatmate listing has been reviewed and is now visible to other users.",
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: "notif-2",
      recipient_id: "user-1",
      sender_id: null,
      type: "system",
      title: "Welcome to NestMate 🏠",
      body: "Your account is ready. Complete your flatmate profile to start matching with compatible roommates.",
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    }
  ],
  verifications: [
    {
      id: "verif-1",
      landlord_id: "landlord-3",
      id_document_url:
        "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=400&q=80",
      selfie_url:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
      verification_status: "pending",
      admin_notes: null,
      created_at: "2026-04-13T10:00:00.000Z",
      reviewed_at: null,
      profile: {
        id: "landlord-3",
        full_name: "Petros Antoniou",
        avatar_url:
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
        bio: "Larnaca host offering simple, well-kept student accommodation.",
        city: "Larnaca",
        user_type: "landlord",
        is_verified_landlord: false
      }
    }
  ],
  stats: {
    totalUsers: 1280,
    totalProperties: 214,
    totalMatches: 379,
    activeListings: 162
  }
};
