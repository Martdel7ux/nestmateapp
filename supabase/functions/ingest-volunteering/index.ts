import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  job_type: string;
  candidate_required_location: string;
  description: string;
  tags: string[];
  publication_date: string;
  company_logo: string | null;
}

interface OpportunityRow {
  type: "volunteering";
  title: string;
  description: string | null;
  organization: string | null;
  location: string;
  location_type: "in_person" | "remote" | "hybrid";
  url: string | null;
  image_url: string | null;
  source: string;
  source_id: string;
  starts_at: string | null;
  ends_at: string | null;
  salary_min: null;
  salary_max: null;
  salary_currency: "EUR";
  employment_type: "volunteer";
  tags: string[];
}

// ─── Remotive helpers ─────────────────────────────────────────────────────────

const VOLUNTEER_KEYWORDS = [
  "volunteer",
  "volunteering",
  "nonprofit",
  "non-profit",
  "ngo",
  "charity",
  "pro bono",
  "unpaid",
  "community service",
];

function isVolunteerRole(job: RemotiveJob): boolean {
  const hay = `${job.title} ${job.description} ${(job.tags ?? []).join(" ")}`.toLowerCase();
  return VOLUNTEER_KEYWORDS.some((kw) => hay.includes(kw));
}

function buildTags(job: RemotiveJob): string[] {
  const tags: string[] = ["volunteering", "remote", "student-friendly"];
  const remotiveTags: string[] = job.tags ?? [];

  const tagMap: Record<string, string> = {
    design: "design",
    marketing: "marketing",
    tech: "tech",
    engineering: "tech",
    software: "tech",
    finance: "finance",
    health: "healthcare",
    medical: "healthcare",
  };

  for (const rt of remotiveTags) {
    const key = rt.toLowerCase();
    for (const [match, mapped] of Object.entries(tagMap)) {
      if (key.includes(match)) tags.push(mapped);
    }
  }

  return [...new Set(tags)];
}

function mapRemotiveJob(job: RemotiveJob): OpportunityRow {
  return {
    type: "volunteering",
    title: job.title,
    description: job.description
      ? job.description.replace(/<[^>]+>/g, " ").trim().slice(0, 1000)
      : null,
    organization: job.company_name ?? null,
    location: job.candidate_required_location || "Remote",
    location_type: "remote",
    url: job.url ?? null,
    image_url: job.company_logo ?? null,
    source: "remotive",
    source_id: String(job.id),
    starts_at: job.publication_date ?? null,
    ends_at: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "EUR",
    employment_type: "volunteer",
    tags: buildTags(job),
  };
}

// ─── Static Cyprus NGO fallback opportunities ─────────────────────────────────
// Used when no Remotive results qualify or as supplementary seed data.

const STATIC_CYPRUS_NGO_OPPORTUNITIES: OpportunityRow[] = [
  {
    type: "volunteering",
    title: "Community Garden Coordinator – Nicosia Urban Farms",
    description:
      "Coordinate weekend planting and harvesting sessions at the Nicosia Community Urban Farm. Responsibilities include scheduling volunteers, maintaining gardening tools, and posting updates to social media.",
    organization: "Nicosia Urban Farms Initiative",
    location: "Nicosia",
    location_type: "in_person",
    url: "https://example.com/volunteer/nicosia-urban-farms",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
    source: "manual",
    source_id: "static-vol-cy-001",
    starts_at: "2025-06-01T00:00:00+00:00",
    ends_at: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "EUR",
    employment_type: "volunteer",
    tags: ["volunteering", "sustainability", "student-friendly"],
  },
  {
    type: "volunteering",
    title: "Legal Aid Volunteer – Refugee Rights Clinic",
    description:
      "Assist qualified lawyers in providing free legal advice to asylum seekers and refugees in Cyprus. Tasks include case file preparation, translation support, and client liaison. Law students welcome.",
    organization: "KISA – Action for Equality, Support, Antiracism",
    location: "Nicosia",
    location_type: "in_person",
    url: "https://example.com/volunteer/kisa-legal",
    image_url: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800",
    source: "manual",
    source_id: "static-vol-cy-002",
    starts_at: "2025-06-01T00:00:00+00:00",
    ends_at: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "EUR",
    employment_type: "volunteer",
    tags: ["volunteering", "student-friendly", "entry-level"],
  },
  {
    type: "volunteering",
    title: "Web & Social Media Volunteer – Environmental NGO",
    description:
      "Update the website, draft newsletters, and manage social channels for a leading Cyprus environmental charity. Fully remote, 3–5 hours per week. Ideal for media or IT students.",
    organization: "Terra Cypria – The Cyprus Conservation Foundation",
    location: "Remote",
    location_type: "remote",
    url: "https://example.com/volunteer/terra-cypria-web",
    image_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800",
    source: "manual",
    source_id: "static-vol-cy-003",
    starts_at: "2025-06-01T00:00:00+00:00",
    ends_at: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "EUR",
    employment_type: "volunteer",
    tags: ["volunteering", "tech", "marketing", "remote", "student-friendly"],
  },
  {
    type: "volunteering",
    title: "Sports Coach Volunteer – Youth Football Academy",
    description:
      "Support professional coaches at weekend football training sessions for children aged 8–14 in Limassol. Physical education or sports science students preferred. DBS/police clearance required.",
    organization: "Limassol Youth Football Academy",
    location: "Limassol",
    location_type: "in_person",
    url: "https://example.com/volunteer/limassol-football",
    image_url: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800",
    source: "manual",
    source_id: "static-vol-cy-004",
    starts_at: "2025-06-07T00:00:00+00:00",
    ends_at: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "EUR",
    employment_type: "volunteer",
    tags: ["volunteering", "student-friendly"],
  },
  {
    type: "volunteering",
    title: "Data Entry & Research Volunteer – Think Tank",
    description:
      "Assist researchers at the PRIO Cyprus Centre with data collection, literature reviews, and formatting policy briefs on conflict resolution and Eastern Mediterranean affairs. Remote-friendly.",
    organization: "PRIO Cyprus Centre",
    location: "Nicosia",
    location_type: "hybrid",
    url: "https://example.com/volunteer/prio-cyprus",
    image_url: "https://images.unsplash.com/photo-1456428746267-a1756408f782?w=800",
    source: "manual",
    source_id: "static-vol-cy-005",
    starts_at: "2025-06-01T00:00:00+00:00",
    ends_at: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "EUR",
    employment_type: "volunteer",
    tags: ["volunteering", "student-friendly", "entry-level"],
  },
];

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let total = 0;
  let skipped = 0;
  const rows: OpportunityRow[] = [];

  try {
    // ── 1. Fetch from Remotive (free, no API key required) ────────────────────
    // Remotive lists remote jobs; we filter for volunteer/nonprofit roles.
    console.log("[ingest-volunteering] Fetching from Remotive...");

    const remotiveUrl =
      "https://remotive.com/api/remote-jobs?limit=100&category=non-tech";

    const remotiveRes = await fetch(remotiveUrl, {
      headers: { Accept: "application/json" },
    });

    if (remotiveRes.ok) {
      const remotiveData = await remotiveRes.json();
      const jobs: RemotiveJob[] = remotiveData.jobs ?? [];
      console.log(
        `[ingest-volunteering] Remotive returned ${jobs.length} listings`
      );

      const volunteerJobs = jobs.filter(isVolunteerRole);
      console.log(
        `[ingest-volunteering] ${volunteerJobs.length} qualify as volunteer roles`
      );

      rows.push(...volunteerJobs.map(mapRemotiveJob));
    } else {
      const errText = await remotiveRes.text();
      console.warn(
        `[ingest-volunteering] Remotive fetch failed (${remotiveRes.status}): ${errText}`
      );
    }

    // ── 2. Also try the tech category on Remotive ─────────────────────────────
    const remotiveTechUrl =
      "https://remotive.com/api/remote-jobs?limit=100&category=software-dev";
    const remotiveTechRes = await fetch(remotiveTechUrl, {
      headers: { Accept: "application/json" },
    });

    if (remotiveTechRes.ok) {
      const techData = await remotiveTechRes.json();
      const techJobs: RemotiveJob[] = techData.jobs ?? [];
      const techVolunteers = techJobs.filter(isVolunteerRole);
      console.log(
        `[ingest-volunteering] Remotive tech category: ${techVolunteers.length} volunteer roles found`
      );
      rows.push(...techVolunteers.map(mapRemotiveJob));
    }

    // ── 3. Always upsert static Cyprus NGO opportunities ─────────────────────
    console.log(
      `[ingest-volunteering] Adding ${STATIC_CYPRUS_NGO_OPPORTUNITIES.length} static Cyprus NGO opportunities`
    );
    rows.push(...STATIC_CYPRUS_NGO_OPPORTUNITIES);

    // ── 4. Deduplicate by source+source_id before upserting ───────────────────
    const seen = new Set<string>();
    const uniqueRows = rows.filter((r) => {
      const key = `${r.source}::${r.source_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(
      `[ingest-volunteering] Upserting ${uniqueRows.length} unique volunteer opportunities`
    );

    if (uniqueRows.length > 0) {
      // Batch in groups of 50 to avoid request size limits
      const BATCH_SIZE = 50;
      for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
        const batch = uniqueRows.slice(i, i + BATCH_SIZE);
        const { error, data: upserted } = await supabase
          .from("opportunities")
          .upsert(batch, { onConflict: "source,source_id" })
          .select("id");

        if (error) {
          console.error(
            `[ingest-volunteering] Upsert error (batch ${i}):`,
            error.message
          );
          skipped += batch.length;
        } else {
          const count = upserted?.length ?? batch.length;
          total += count;
          console.log(
            `[ingest-volunteering] Batch ${i}–${i + batch.length - 1}: upserted ${count}`
          );
        }
      }
    }

    console.log(
      `[ingest-volunteering] Done. Total upserted: ${total}, skipped/errored: ${skipped}`
    );

    return new Response(
      JSON.stringify({ success: true, upserted: total, skipped }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[ingest-volunteering] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
