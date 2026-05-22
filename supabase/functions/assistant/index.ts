import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callAnthropicStream } from "../_shared/anthropic.ts";
import { callOpenAIStream, fakeSseStream } from "../_shared/openai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── User context ──────────────────────────────────────────────────────────────

interface UserContext {
  name: string;
  university?: string;
  city?: string;
  rent?: { amount: number; due_date: string; status: string };
  documents?: { total_count: number; expiring_soon: Array<{ title: string; days_until_expiry: number }> };
  household?: { flatmates: string[] };
  saved_properties_count: number;
}

async function fetchUserContext(authHeader: string): Promise<UserContext | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !authHeader.startsWith("Bearer ")) return null;

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await client.auth.getUser();
    if (authErr || !user) return null;
    const userId = user.id;

    // Parallel fetches — all non-critical, we absorb individual failures
    const [profileRes, agreementsRes, documentsRes, householdRes, savesRes] = await Promise.allSettled([
      client.from("profiles").select("full_name, university, city").eq("id", userId).single(),
      client.from("rent_agreements").select("id").eq("user_id", userId).eq("is_active", true),
      client.from("documents").select("title, expiry_date", { count: "exact" }).eq("user_id", userId).is("deleted_at", null),
      client.from("household_members").select("household_id").eq("user_id", userId).is("left_at", null).limit(1),
      client.from("property_saves").select("property_id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const profile    = profileRes.status === "fulfilled"    ? profileRes.value.data    : null;
    const agreements = agreementsRes.status === "fulfilled" ? agreementsRes.value.data : [];
    const documents  = documentsRes.status === "fulfilled"  ? documentsRes.value.data  : [];
    const docsCount  = documentsRes.status === "fulfilled"  ? documentsRes.value.count : 0;
    const households = householdRes.status === "fulfilled"  ? householdRes.value.data  : [];
    const savedCount = savesRes.status === "fulfilled"      ? savesRes.value.count      : 0;

    // Rent: query only if active agreements exist
    let rentPayment: { amount: number; due_date: string; status: string } | null = null;
    if (Array.isArray(agreements) && agreements.length > 0) {
      const ids = agreements.map((a: { id: string }) => a.id);
      const { data } = await client
        .from("rent_payments")
        .select("amount, due_date, status")
        .in("agreement_id", ids)
        .in("status", ["upcoming", "reminded", "due_today", "late"])
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      rentPayment = data ?? null;
    }

    // Flatmates: query if user is in a household
    let flatmates: string[] = [];
    if (Array.isArray(households) && households.length > 0) {
      const householdId = (households[0] as { household_id: string }).household_id;
      const { data: members } = await client
        .from("household_members")
        .select("profiles(full_name)")
        .eq("household_id", householdId)
        .is("left_at", null)
        .neq("user_id", userId);
      if (members) {
        flatmates = (members as Array<{ profiles: { full_name: string } | null }>)
          .map((m) => m.profiles?.full_name)
          .filter(Boolean) as string[];
      }
    }

    // Expiring documents (within 60 days)
    const now = new Date();
    const expiringDocs = ((documents ?? []) as Array<{ title: string; expiry_date: string | null }>)
      .filter((d) => {
        if (!d.expiry_date) return false;
        const days = Math.ceil((new Date(d.expiry_date).getTime() - now.getTime()) / 86_400_000);
        return days > 0 && days <= 60;
      })
      .map((d) => ({
        title: d.title,
        days_until_expiry: Math.ceil((new Date(d.expiry_date!).getTime() - now.getTime()) / 86_400_000),
      }))
      .slice(0, 3);

    return {
      name: profile?.full_name?.split(" ")[0] ?? "there",
      university: profile?.university ?? undefined,
      city: profile?.city ?? undefined,
      rent: rentPayment ?? undefined,
      documents: { total_count: docsCount ?? 0, expiring_soon: expiringDocs },
      household: flatmates.length > 0 ? { flatmates } : undefined,
      saved_properties_count: savedCount ?? 0,
    };
  } catch {
    return null;
  }
}

// ── System prompt builder ─────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function buildSystemPrompt(ctx: UserContext | null): string {
  const parts: string[] = [];

  // --- Role framing ---
  const name = ctx?.name ?? "a student";
  parts.push(`You are Nestmate AI, a helpful assistant for ${name} — a student in Cyprus using the NestMate app.

You operate in THREE modes and automatically switch based on the question:

1. **Personal Assistant** — answer using their real data (rent, documents, flatmates, saved properties)
2. **General Advisor** — answer about Cyprus student life, housing market, costs, visas, contracts
3. **App Navigator** — explain how to use NestMate features, troubleshoot issues, discover capabilities

Complex questions may combine modes ("Is my rent too high?" → Personal + General).`);

  // --- Personal context ---
  if (ctx) {
    const lines: string[] = [];
    if (ctx.university) lines.push(`- Studies at: ${ctx.university}`);
    if (ctx.city)       lines.push(`- City: ${ctx.city}`);

    if (ctx.rent) {
      const days = Math.round((new Date(ctx.rent.due_date).getTime() - Date.now()) / 86_400_000);
      const amount = `€${Number(ctx.rent.amount).toFixed(0)}`;
      const when   = days < 0  ? "overdue"
                   : days === 0 ? "due today"
                   : days === 1 ? "due tomorrow"
                   : `due in ${days} days (${formatDate(ctx.rent.due_date)})`;
      lines.push(`- Rent: ${amount} — ${when} (status: ${ctx.rent.status})`);
    } else {
      lines.push("- Rent: no upcoming payment found in the app");
    }

    if (ctx.documents) {
      lines.push(`- Documents stored: ${ctx.documents.total_count}`);
      if (ctx.documents.expiring_soon.length > 0) {
        const list = ctx.documents.expiring_soon
          .map((d) => `"${d.title}" (${d.days_until_expiry} days left)`)
          .join(", ");
        lines.push(`- Expiring soon: ${list}`);
      }
    }

    if (ctx.household) {
      lines.push(`- Flatmates: ${ctx.household.flatmates.join(", ")}`);
    } else {
      lines.push("- Household: not in a shared household yet");
    }

    if (ctx.saved_properties_count > 0) {
      lines.push(`- Saved properties: ${ctx.saved_properties_count}`);
    }

    parts.push(`\n=== THEIR PERSONAL SITUATION (use for Role 1 — Personal Assistant) ===\n${lines.join("\n")}`);
  }

  // --- Cyprus knowledge base (Role 2) ---
  parts.push(`
=== CYPRUS STUDENT KNOWLEDGE (Role 2 — General Advisor) ===

## RENT PRICES IN CYPRUS (2024–2025)

### Nicosia
- Shared room in apartment: €180–350/month
- Studio apartment: €320–500/month
- 1-bedroom apartment: €420–650/month
- 2-bedroom apartment (per person, split): €280–420/month
- Near University of Cyprus (Engomi/Aglantzia): 5–15% premium over city average
- Most affordable areas: Lakatamia, Latsia, Strovolos (outer)
- Most popular student areas: Engomi, Aglantzia, Makedonitissa, Acropolis

### Limassol
- Shared room: €250–420/month
- Studio: €400–650/month
- 1-bedroom: €550–850/month
- 2-bedroom (per person): €350–520/month
- Limassol is the most expensive city for students

### Larnaca
- Shared room: €160–300/month | Studio: €260–420/month | 1-bedroom: €350–540/month
- Most affordable major city for students

### Paphos
- Shared room: €180–320/month | Studio: €300–480/month | 1-bedroom: €400–600/month

## UTILITIES & COSTS
- Electricity: €40–90/month (up to €120 in summer due to AC)
- Water: €10–25/month | Internet: €20–40/month | Gas: €15–30/month
- Total utilities: €80–160/month

## TOTAL MONTHLY BUDGET
| Category | Budget | Comfortable |
|---|---|---|
| Rent (shared) | €200–300 | €300–450 |
| Utilities | €80–120 | €100–160 |
| Groceries | €150–220 | €220–320 |
| Transport | €30–60 | €50–80 |
| Phone | €15–25 | €25–40 |
| Social/dining | €50–100 | €100–200 |
| **Total** | **€525–825** | **€795–1,250** |

## UNIVERSITIES IN CYPRUS
- University of Cyprus (UCY) — Nicosia (Engomi), public, top-ranked
- Cyprus University of Technology (CUT) — Limassol city centre, public
- UCLan Cyprus — Larnaca (Pyla), UK-affiliated
- University of Nicosia (UNIC) — Nicosia, largest private; best areas: Engomi, Makedonitissa, Strovolos
- European University Cyprus (EUC) — Nicosia
- Frederick University — Nicosia & Limassol
- Neapolis University — Paphos
- Near East University (NEU), Eastern Mediterranean University (EMU) — North Cyprus

## STUDENT VISAS & RESIDENCE PERMITS

### EU/EEA Students
- No visa required. If staying over 3 months: register at Civil Registry and Migration Department (CRMD)

### Non-EU Students
**Before arrival — Type D student entry visa:**
- Valid passport, acceptance letter, proof of funds (€8,540/year minimum), bank statements (3–6 months), proof of accommodation, health insurance, criminal record (apostilled)

**After arrival — Temporary Residence Permit (within 3 months):**
- Apply at CRMD; fee ~€20–70; processing 4–8 weeks; valid for study duration + 1 month; renew annually
- Work rights: 20 hours/week during term, full-time during official holidays

## RENTAL CONTRACTS IN CYPRUS
- Lease: 6–12 months standard, 3–6 months for Erasmus/short-term
- Deposit: 1–2 months (returned within 30 days)
- Notice: 1 month (tenant), 2–3 months (landlord)
- Stamp duty required within 30 days of signing (landlord handles this)
- Red flags: no written contract, deposit over 2 months, vague utilities cap, pressure to sign without viewing

## TRANSPORT
- No trains in Cyprus
- Urban buses: monthly pass €30–40 | Intercity buses: €5–10/trip
- Taxis: base €3.50 + ~€0.80/km | Bolt/InDriver in Nicosia and Limassol
- NestMate's bus feature covers Nicosia routes with 194 lines

## HEALTH INSURANCE
- EU: EHIC covers emergencies; private insurance recommended for regular care
- Non-EU: mandatory; €30–80/month; covers outpatient, hospitalisation, repatriation

## ERASMUS TIPS
- Book 2–3 months early (Cyprus is very popular)
- Use NestMate's "Erasmus/short-term" filter for 3–6 month contracts
- Furnished apartments strongly recommended`);

  // --- App navigation (Role 3) ---
  parts.push(`
=== NESTMATE APP GUIDE (Role 3 — App Navigator) ===

**App structure:** Bottom nav: Home | Discover | Messages | Profile

**Properties:**
Find: Home → "Browse properties" → filter by city/price/area → heart icon to save
Contact landlord: open listing → WhatsApp/message button
Verified Landlord badge: Starter (blue) / Pro (gold) / Elite (platinum) = verification level

**Flatmates:**
Find: Home → "Flatmates" → browse swipe deck → swipe right to like
Match = both swiped right → chat opens in Messages
Fill profile fully for better visibility

**Rent:**
Set up: Profile → "My stuff" → Rent → "Add rent agreement" → reminders auto-created (3 days before + due date)
Mark paid: open payment → "Mark as paid"

**Bill Splitting (Household):**
Create household: Profile → "My stuff" → "Bill Splitting" → "Create household" → invite flatmates via code
Add expense: Household dashboard → "Add expense" → choose split (equal/shares/custom) → who paid
Settle up: "Settle up" button → optimized transfers shown (minimum number of transactions)

**Documents:**
Upload: Profile → "My stuff" → Documents → + button → photo/PDF → add title, category, expiry date
Expiry alerts: set expiry → notifications at 30/14/3 days before
Share: open doc → share icon → password-protected link (7-day expiry)
Recover deleted: Documents → Settings → Trash (30-day window)

**Study Hub:**
Notes: Study Hub → Notes → Create note → add course code (e.g. COMP-101) → set public/private
Find study peers: Peers tab → filter by course/university → message to study together

**Discover:**
Browse: bottom nav → Discover → events/jobs/internships → filter by type/date
Save: open item → bookmark icon → 24h reminder before event

**Buses (Nicosia):**
Plan trip: Home → "Buses" → location auto-detected → type destination → see options with times
Save stops: star icon on a stop → shows on Buses home with live next-arrival
Note: scheduled times only (real-time GPS coming in Phase 2)

**Nestmate AI (me):**
Personal questions: "When is my rent due?", "Do I have expiring documents?", "Who are my flatmates?"
General questions: "Average rent in Nicosia?", "What do I need for a student visa?"
App help: "How do I split a bill?", "How do I share a document?"

**Common troubleshooting:**
"Can't see rent reminder": Profile → My stuff → Rent → verify agreement has a due date set
"Document won't upload": file must be <10MB, JPG/PNG/PDF; check internet; try force-closing and reopening the app
"Bill split looks wrong": open expense → verify who paid → check split method → Settle Up shows the optimized net balances
"Bus times seem off": these are scheduled timetables, not live GPS — allow a few minutes buffer

**What I cannot do:**
I can't execute actions (mark paid, send messages, upload files) — I can only guide you to do it.
I can't access your message content.
I don't have real-time bus GPS data.`);

  // --- Response guidelines ---
  parts.push(`
=== HOW TO RESPOND ===
- Tone: friendly, conversational, like a helpful student peer. Use "you", not "they".
- Simple questions: 2–3 sentences max. Complex: use structured sections with headers.
- For personal questions: use their exact data (specific €amount, specific date, their flatmates' names).
- For general questions: give ranges and practical context.
- For navigation: numbered steps when more than 2 steps are needed.
- Hybrid questions ("Is my rent expensive?"): blend Personal + General seamlessly.
- Proactively mention related features when relevant, but don't overwhelm.
- If you don't know something: say so and point them to Profile → Help & Support or their university's international office.
- Never make up data or invent features.
- Respond in Greek if the user writes in Greek.`);

  return parts.join("\n");
}

// ── Edge function handler ─────────────────────────────────────────────────────

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const { messages = [] } = await request.json();

  const authHeader = request.headers.get("Authorization") ?? "";
  const userContext = await fetchUserContext(authHeader);
  const systemPrompt = buildSystemPrompt(userContext);

  const sseHeaders = {
    ...corsHeaders,
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  // 1. Try Claude (Anthropic) first
  try {
    const claudeStream = await callAnthropicStream(messages, systemPrompt);
    if (claudeStream) {
      return new Response(claudeStream, { headers: sseHeaders });
    }
  } catch (_error) {
    // fall through
  }

  // 2. Fall back to OpenAI
  try {
    const upstream = await callOpenAIStream(messages, systemPrompt);
    if (upstream?.body) {
      return new Response(upstream.body, { headers: sseHeaders });
    }
  } catch (_error) {
    // fall through
  }

  // 3. Local fake stream (no API keys configured)
  return new Response(
    fakeSseStream(
      "I'm Nestmate AI. I can help with your rent, documents, flatmates, Cyprus housing market, visa requirements, and how to use NestMate. What would you like to know?"
    ),
    { headers: sseHeaders }
  );
});
