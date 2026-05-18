import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, SendHorizontal } from "lucide-react";

export interface AssistantChatRef {
  setInput: (value: string) => void;
}
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ── Local knowledge base fallback (used when Supabase isn't configured) ──────
function localAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.match(/rent|price|cost|how much|expensive|cheap|budget|afford/)) {
    return `## Rent Prices in Cyprus (2024–2025)

**Nicosia**
- Shared room: €180–350/mo
- Studio: €320–500/mo
- 1-bedroom: €420–650/mo

**Limassol** *(most expensive)*
- Shared room: €250–420/mo
- Studio: €400–650/mo
- 1-bedroom: €550–850/mo

**Larnaca** *(most affordable)*
- Shared room: €160–300/mo
- Studio: €260–420/mo
- 1-bedroom: €350–540/mo

**Paphos**
- Shared room: €180–320/mo
- Studio: €300–480/mo

**Monthly budget estimate:** €525–825 (budget) to €795–1,250 (comfortable), including rent, utilities, groceries, and transport.

Use NestMate's price filter to find listings within your budget.`;
  }

  if (q.match(/visa|permit|residence|immigration|stay|legal|document|passport/)) {
    return `## Student Visa & Residence Permit in Cyprus

**EU/EEA Students:** No visa needed. If staying over 3 months, register at the Civil Registry and Migration Department (CRMD).

**Non-EU International Students:**

**Before arrival — get a Type D student entry visa from the Cyprus Embassy in your country. You'll need:**
- Acceptance letter from your Cyprus university
- Proof of funds: **minimum €8,540/year** (or ~€2,000/semester)
- Bank statements (last 3–6 months)
- Proof of accommodation (rental contract)
- Health insurance policy
- Clean criminal record (apostilled)
- Valid passport

**After arrival — apply for Temporary Residence Permit within 3 months:**
- Visit the local District Administration / CRMD office
- Processing time: 4–8 weeks — **apply early**
- Fee: ~€20–70
- Permit lasts for duration of studies + 1 month
- Renew annually

**Work rights:** Up to **20 hours/week** during term; full-time during official holidays.

Contact your university's international office — they help with this process.`;
  }

  if (q.match(/contract|lease|agreement|sign|deposit|notice|stamp|clause|tenant|landlord/)) {
    return `## Rental Contracts in Cyprus

**Standard terms:**
- Lease length: 6–12 months (3–6 months for Erasmus/short-term)
- Security deposit: 1–2 months' rent (returned within 30 days of moving out)
- Notice period: 1 month (tenant), 2–3 months (landlord)

**Your contract must include:**
- Names and IDs of both parties
- Full property address
- Start/end dates
- Monthly rent and due date
- Deposit amount and return conditions
- Who pays utilities
- Pet, subletting, and guest rules
- Inventory list

**Stamp duty (required by law):** All contracts must be stamped at the Tax Department within **30 days** of signing. The landlord usually handles this.

**Red flags:**
- No written contract offered
- Deposit over 2 months' rent
- Vague "bills included" with no cap
- Pressure to sign without viewing

Always take photos of the apartment on move-in day and document any existing damage.`;
  }

  if (q.match(/erasmus|exchange|short.?term|semester/)) {
    return `## Erasmus & Short-Term Students in Cyprus

- Cyprus is one of the **most popular Erasmus destinations** — book early (2–3 months before arrival)
- Use NestMate's **"Erasmus / short-term"** filter in the Flatmates section to find compatible flatmates
- Short-term leases of **3–6 months** are available — filter by student type when searching
- **Furnished apartments** are strongly recommended so you don't need to buy furniture
- EU Erasmus students: no visa, but register with CRMD if staying over 3 months
- Non-EU Erasmus: check with your home country's embassy and your university's Erasmus office
- Your university's Erasmus coordinator may have a list of vetted landlords
- Grants are paid in instalments — plan your cash flow for the first month`;
  }

  if (q.match(/utilit|electric|water|internet|wifi|bill|gas/)) {
    return `## Utilities in Cyprus

| Utility | Monthly cost |
|---|---|
| Electricity | €40–90 (up to €120 in summer — AC use is high) |
| Water | €10–25 |
| Internet (fiber) | €20–40 |
| Gas (if applicable) | €15–30 |
| **Total** | **€80–160/month** |

- **"Bills included"** listings: always confirm exactly what's covered and if there's a cap on electricity
- Electricity is supplied by the **Electricity Authority of Cyprus (EAC)**
- Internet providers: Cyta, Epic, Primetel — fiber available in most urban areas
- NestMate property listings show whether utilities are included`;
  }

  if (q.match(/university of nicosia|unic\b/)) {
    return `## University of Nicosia (UNIC)

The **University of Nicosia** is the largest private university in Cyprus and among the largest English-language universities in Europe.

**Key facts:**
- Located in **Engomi, Nicosia** — close to the city centre
- Offers undergraduate, postgraduate, and doctoral programmes
- Strong programmes in: Medicine, Law, Business, Education, Architecture, and IT
- Fully accredited by CYQAA and internationally recognised
- One of the first universities globally to offer a **Master's in Digital Currency**
- Large international student body — very multicultural campus

**Best areas to live near UNIC:**
- **Engomi** — closest to campus; studios €320–480/mo
- **Makedonitissa** — 10-min drive; slightly cheaper
- **Strovolos** — well-connected, affordable (€280–420/mo for shared room)
- **Acropolis** — central, lively area popular with students

**Typical rent near UNIC:**
- Shared room: €220–380/mo
- Studio: €340–520/mo
- 1-bedroom: €440–650/mo

Search NestMate for listings in Engomi or Makedonitissa to find accommodation near UNIC.`;
  }

  if (q.match(/universit|college|campus|uclan|ucy|cut|tepak|frederick/)) {
    return `## Universities in Cyprus & Location Guide

| University | City | Notes |
|---|---|---|
| University of Cyprus (UCY) | Nicosia (Engomi) | Public, top-ranked |
| Cyprus University of Technology (CUT) | Limassol | Public, city centre |
| UCLan Cyprus | Larnaca (Pyla) | UK-affiliated |
| Frederick University | Nicosia & Limassol | Private |
| European University Cyprus | Nicosia (Engomi) | Private |
| University of Nicosia (UNIC) | Nicosia (Engomi) | Largest private |
| Neapolis University | Paphos | Private |
| Near East University (NEU) | Kyrenia (North) | Large, private |
| Eastern Mediterranean University (EMU) | Famagusta (North) | Large, private |

**Best areas to live near campus:**
- UCY → Engomi, Aglantzia, Makedonitissa
- CUT → Agios Athanasios, Mesa Geitonia
- UCLan → Oroklini, Drosia, Aradippou
- UNIC → Engomi, Makedonitissa, Strovolos`;
  }

  if (q.match(/transport|bus|car|scooter|taxi|bolt|drive|commute|travel/)) {
    return `## Transport in Cyprus

- Cyprus has **no train network** — buses and taxis are the main options
- **Urban buses:** each city has its own operator; monthly pass €30–40
- **Intercity buses:** connect cities; tickets €5–10 per journey
- **Taxi:** base fare ~€3.50 + ~€0.80/km; metered
- **Bolt / InDriver:** available in Nicosia and Limassol
- **Scooter rental:** popular with students; ~€100–200/month
- EU driving licences accepted; non-EU students may need an **International Driving Permit**
- Many students choose accommodation within **walking or cycling distance** of campus`;
  }

  if (q.match(/health|insurance|doctor|hospital|gesy|ehic|medical/)) {
    return `## Health Insurance for Students in Cyprus

**EU Students:**
- Your **European Health Insurance Card (EHIC)** covers emergency and medically necessary treatment — free to apply in your home country
- For routine care, consider supplemental private insurance

**Non-EU Students:**
- Health insurance is **mandatory** to obtain your student residence permit
- Cost: €30–80/month for a student plan
- Options: university group policy (often cheapest), Allianz, AXA, CNP Cyprialife, Laiki Cyprialife
- Policy must cover outpatient visits, hospitalisation, and emergency repatriation

**Cyprus General Healthcare System (GESY):**
- Introduced in 2020; covers EU citizens and legal residents
- International students should check with their university whether they qualify`;
  }

  if (q.match(/nestmate|app|platform|feature|how.*work|swipe|match|listing|search|filter|verified|badge/)) {
    return `## How NestMate Works

**Finding a property:**
- Home tab → filter by city, bedrooms, bathrooms, price, and neighbourhood
- Tap the heart to save a property; find saved ones in your Profile
- **Verified Landlord badge (🛡️):** landlord has submitted ID + selfie and been approved — extra trust

**Finding a flatmate:**
- Flatmates tab → complete your profile first (student type, budget, city, pets, language)
- Swipe right on profiles you like
- If both of you swipe right = **match** → chat opens in Messages
- Use filters: city, student type, budget range

**Tips:**
- Complete your flatmate profile fully — it improves your visibility
- Look for Verified Landlord badges for safer rentals
- Use the AI Assistant (me!) for any questions about Cyprus housing, visas, or contracts`;
  }

  if (q.match(/neighb|area|zone|district|where.*live|best.*place|safest|quiet|central/)) {
    return `## Best Neighbourhoods for Students in Cyprus

**Nicosia**
- **Engomi** — most popular for UCY students; walkable to campus; €300–480/studio
- **Aglantzia** — close to UCY; quieter, slightly cheaper
- **Makedonitissa** — residential, good bus links
- **Strovolos** — larger area, affordable, well-connected

**Limassol**
- **Agios Athanasios / Mesa Geitonia** — near CUT, lively
- **Germasogeia / Potamos Germasogeia** — close to beach; popular with international students
- **Polemidia** — affordable, student-friendly

**Larnaca**
- **Finikoudes** — seafront, central, lively
- **Oroklini / Drosia** — near UCLan, quieter, affordable
- **Aradippou** — residential, good value

**Paphos**
- **Kato Paphos** — tourist area but central
- **Chloraka / Emba** — residential, good for longer stays`;
  }

  // Default response
  return `## I'm NestMate AI — Cyprus Student Housing Expert

I can help you with:
- 🏠 **Rent prices** across all Cyprus cities
- 📋 **Rental contracts** — what to check and watch out for
- 🛂 **Student visas** and residence permits for non-EU students
- 🏫 **Universities** and the best areas to live near each campus
- 💶 **Cost of living** breakdown (utilities, food, transport)
- 🔄 **Erasmus & short-term** accommodation tips
- 🚌 **Transport** options around Cyprus
- 🏥 **Health insurance** requirements
- 📱 **How to use NestMate** — search, swipe, match, and message

What would you like to know?`;
}

// ── Stream parser ─────────────────────────────────────────────────────────────
async function streamEdgeFunction(
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const url = `${SUPABASE_URL}/functions/v1/assistant`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY ?? "",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok || !response.body) throw new Error("Edge function error");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.delta ?? parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) onChunk(delta);
        } catch {
          // ignore malformed lines
        }
      }
    }
  }
  onDone();
}

// ── Suggested questions ───────────────────────────────────────────────────────
const suggestions = [
  "What's the average rent in Nicosia?",
  "What documents do I need for a student visa?",
  "What should I check in a rental contract?",
  "Best areas to live near UCY?",
  "How much does a student spend per month?",
  "Erasmus accommodation tips",
];

// ── Component ─────────────────────────────────────────────────────────────────
const starter: Message[] = [
  {
    role: "assistant",
    content:
      "## Welcome to NestMate AI 👋\n\nI'm your Cyprus student accommodation expert. Ask me anything about:\n- Rent prices across all cities\n- Student visas & residence permits\n- Rental contracts & tenant rights\n- Cost of living & utilities\n- Best neighbourhoods near your university\n- Erasmus & short-term stays\n\nWhat would you like to know?",
  },
];

export const AssistantChat = forwardRef<AssistantChatRef, { initialPrompt?: string }>(
function AssistantChat({ initialPrompt }, ref) {
  const [messages, setMessages] = useState<Message[]>(starter);
  const [draft, setDraft] = useState(initialPrompt ?? "");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    setInput: (value: string) => setDraft(value),
  }));

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || streaming) return;
    setDraft("");

    const userMsg: Message = { role: "user", content: question };
    const history = [...messages, userMsg];
    setMessages(history);
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...history, assistantMsg]);

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        await streamEdgeFunction(
          history,
          (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + chunk,
              };
              return updated;
            });
          },
          () => setStreaming(false)
        );
        return;
      } catch {
        // fall through to local fallback
      }
    }

    // Local fallback — keyword-based answers with word-by-word streaming effect
    const answer = localAnswer(question);
    const words = answer.split(" ");
    let index = 0;
    const tick = window.setInterval(() => {
      if (index >= words.length) {
        clearInterval(tick);
        setStreaming(false);
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: updated[updated.length - 1].content + (index === 0 ? "" : " ") + words[index],
        };
        return updated;
      });
      index++;
    }, 30);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send(draft);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden px-5">
      {/* Scrollable messages with fade mask at the bottom */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        <div className="flex flex-col gap-4 pb-20 pt-2">
          {/* Suggested questions — only show at the start */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles size={15} />
                </div>
              )}
              <Card
                className={`max-w-[85%] px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "rounded-[1.5rem] rounded-tr-md bg-primary text-primary-foreground"
                    : "rounded-[1.5rem] rounded-tl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <>
                    <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert [&_table]:text-xs [&_th]:font-semibold [&_td]:py-1">
                      {msg.content || "▌"}
                    </ReactMarkdown>
                    {msg.content && !streaming && (
                      <p className="mt-3 border-t border-border/50 pt-3 text-[11px] leading-snug text-muted-foreground">
                        ⚠️ This information is for general guidance only and may not be fully accurate or up to date. Please verify with the relevant authorities — such as your university's international office, the Civil Registry and Migration Department (CRMD), or a licensed professional — before making any decisions.
                      </p>
                    )}
                  </>
                ) : (
                  msg.content
                )}
              </Card>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — pinned at the bottom */}
      <div className="shrink-0 pb-6 pt-3">
        <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-card">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder="Ask me anything…"
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            onClick={() => send(draft)}
            disabled={!draft.trim() || streaming}
            className="h-10 w-10 shrink-0 rounded-xl p-0"
          >
            <SendHorizontal size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
});
