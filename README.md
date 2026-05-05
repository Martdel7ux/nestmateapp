# NestMate

NestMate is a mobile-first student accommodation and flatmate matching platform for Cyprus, built with React 18, TypeScript, Vite, Tailwind CSS, shadcn-style UI primitives, and Supabase.

## Included

- Auth-ready frontend flows for email/password, Google OAuth, reset, and GDPR consent gating
- Student rental discovery with filters, AI-search-ready UX, saved properties, map/grid view, and property detail overlays
- Landlord dashboard with visibility controls plus an AI-assisted property form
- Flatmate listing creation and swipe-style matching UI
- Realtime messaging, notifications, assistant chat, onboarding, splash, theme toggle, i18n, and PWA wiring
- Supabase SQL migration with enums, tables, helper functions, triggers, storage buckets, and RLS policies
- Supabase Edge Functions for smart search, description generation, review summaries, message translation, and assistant streaming

## Run locally

1. Copy `.env.example` to `.env` and add your Supabase keys.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Apply the database migration with the Supabase CLI.
5. Deploy the edge functions after setting secrets such as `OPENAI_API_KEY`, `OPENAI_MODEL`, and VAPID keys.

## Notes

- The UI includes seeded demo data so the app remains explorable before Supabase is connected.
- The AI buttons and streaming assistant are designed to call the included edge functions when backend config is present.
- Storage buckets expected by the migration are `avatars`, `property-images`, `flatmate-images`, `chat-attachments`, and `verification-docs`.
