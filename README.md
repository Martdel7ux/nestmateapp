## Nestmate
The complete student utility app for Cyprus universities.
Nestmate started as a housing/flatmate finder and evolved into something bigger: a one-stop app for everything students in Cyprus actually need — from finding a flat to catching the bus to campus, tracking rent, storing documents, and discovering what's happening around them.
Built for students at UNIC, UCY, CUT, EUC, and anyone navigating student life in Cyprus.

## What it does
## Housing & Flatmates

Browse verified property listings across Cyprus (Nicosia, Limassol, Larnaca, Paphos)
Find flatmates looking to share
Landlord verification system with tiered badges (Starter/Pro/Elite)
Save favorites, filter by city/area/price

## Discover (Events & Opportunities)

Curated feed of events, job postings, internships, and volunteering opportunities
Save opportunities and get reminders before events
Filter by type, location, date
Calendar integration (Google, Outlook, Apple)
Admin curation system for quality control

## Study Hub

Share and discover study notes across courses
Real university course codes (COMP-101, EPL131, MED-205, etc.)
Public note library with upvoting
Find study peers and mentors in your courses
Real-time messaging (group chats + direct messages)
Course-based peer matching

## Households & Bills

Split rent and bills with flatmates
Automatic balance tracking with visual summaries
Multiple split methods: equal, shares, custom
Smart settlement algorithm (minimum transactions)
Receipt uploads and expense history
Real-time balance updates

## Rent Reminders

Set up your rent agreement (personal or household-wide)
Get push notifications 3 days before + on due day
Mark as paid (auto-creates household expense if shared)
Landlord contact block with WhatsApp/SMS/email quick actions

## Document Storage

Secure storage for leases, IDs, receipts, insurance, permits
OCR text extraction for searchability
Expiry reminders (30/14/3 days before)
Share documents via password-protected links
30-day soft delete with recovery
Linked to rent agreements and properties

## Bus Routes & Trip Planner

Full Nicosia public transit integration (194 routes, 1,784 stops)
Real GTFS schedule data (valid through August 2026)
Interactive map with route shapes and stop markers
Live next-arrival times at every stop
Trip planner: enter current location + destination → see direct route options with walking times
Save favorite stops
Arrival notifications (coming soon)
Real-time GPS tracking (Phase 2 when operator data available)

## Cyprus Student Tools

Summer Bills Calculator: estimate EAC electricity costs by apartment type
EAC Outage Notifications: see scheduled power outages in your area
Bus Routes: university shuttles + public transit
Garbage Schedule: collection days by area with night-before reminders

## Help & Support

Searchable help center with articles across 10 categories
Multi-channel contact: email, WhatsApp, in-app messaging
AI Assistant integration for quick help
Admin support ticket queue with real-time replies

## AI Assistant

Context-aware help with Nestmate features
Handoff from help articles when needed
Powered by Claude (Anthropic)

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
