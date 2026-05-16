import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADZUNA_APP_ID = Deno.env.get("ADZUNA_APP_ID") ?? "";
const ADZUNA_APP_KEY = Deno.env.get("ADZUNA_APP_KEY") ?? "";
const COUNTRY = Deno.env.get("DEFAULT_REGION") ?? "cy"; // Adzuna uses ISO 2-letter country codes

// Keywords that classify a listing as an internship rather than a job
const INTERNSHIP_KEYWORDS = [
  "intern",
  "internship",
  "placement",
  "trainee",
  "graduate scheme",
  "work experience",
  "apprentice",
];

// Search terms targeting student/entry-level positions
const SEARCH_QUERIES = ["entry level", "graduate", "junior", "intern"];

type OppType = "job" | "internship";
type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "volunteer";
type LocationType = "in_person" | "remote" | "hybrid";

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company?: { display_name: string };
  location?: { display_name: string; area?: string[] };
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string; // "full_time" | "part_time"
  contract_type?: string; // "permanent" | "contract"
  created: string;
  category?: { label: string };
}

function classifyType(title: string, description: string): OppType {
  const haystack = `${title} ${description}`.toLowerCase();
  return INTERNSHIP_KEYWORDS.some((kw) => haystack.includes(kw))
    ? "internship"
    : "job";
}

function mapEmploymentType(
  oppType: OppType,
  contractTime?: string
): EmploymentType {
  if (oppType === "internship") return "internship";
  if (contractTime === "part_time") return "part_time";
  return "full_time";
}

function deriveLocationTags(locationName: string): string[] {
  const lower = locationName.toLowerCase();
  if (lower.includes("remote")) return ["remote"];
  if (lower.includes("hybrid")) return ["hybrid"];
  return [];
}

function deriveLocationType(locationName: string): LocationType {
  const lower = locationName.toLowerCase();
  if (lower.includes("remote")) return "remote";
  if (lower.includes("hybrid")) return "hybrid";
  return "in_person";
}

function buildTags(
  oppType: OppType,
  title: string,
  description: string,
  locationName: string,
  categoryLabel?: string
): string[] {
  const tags: string[] = [oppType, "entry-level"];

  if (categoryLabel) {
    const cat = categoryLabel.toLowerCase();
    if (cat.includes("it") || cat.includes("tech") || cat.includes("software")) tags.push("tech");
    if (cat.includes("finance") || cat.includes("account")) tags.push("finance");
    if (cat.includes("marketing") || cat.includes("media")) tags.push("marketing");
    if (cat.includes("health") || cat.includes("medical")) tags.push("healthcare");
    if (cat.includes("design") || cat.includes("creative")) tags.push("design");
  }

  tags.push(...deriveLocationTags(locationName));

  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes("paid") || combined.includes("salary")) tags.push("paid");
  if (combined.includes("student")) tags.push("student-friendly");

  return [...new Set(tags)];
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let total = 0;
  let skipped = 0;

  try {
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      return new Response(
        JSON.stringify({
          error: "ADZUNA_APP_ID and ADZUNA_APP_KEY environment variables must be set",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Adzuna country code must be lowercase two-letter
    const countryCode = COUNTRY.toLowerCase().slice(0, 2);

    for (const query of SEARCH_QUERIES) {
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 5) {
        const url =
          `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}` +
          `?app_id=${encodeURIComponent(ADZUNA_APP_ID)}` +
          `&app_key=${encodeURIComponent(ADZUNA_APP_KEY)}` +
          `&results_per_page=20` +
          `&what=${encodeURIComponent(query)}` +
          `&content-type=application/json`;

        console.log(
          `[ingest-jobs] Query="${query}" page=${page}: ${url}`
        );

        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(
            `[ingest-jobs] Adzuna API error (${res.status}): ${errText}`
          );
          break;
        }

        const data = await res.json();
        const results: AdzunaJob[] = data.results ?? [];
        const totalCount: number = data.count ?? 0;
        const pageSize = results.length;
        const fetchedSoFar = (page - 1) * 20 + pageSize;
        hasMore = fetchedSoFar < totalCount && pageSize === 20;

        console.log(
          `[ingest-jobs] Query="${query}" page=${page}: received ${results.length} jobs, total available=${totalCount}`
        );

        if (results.length === 0) {
          page++;
          continue;
        }

        const rows = results.map((job) => {
          const locationName =
            job.location?.display_name ?? COUNTRY.toUpperCase();
          const oppType = classifyType(job.title, job.description);

          return {
            type: oppType,
            title: job.title,
            description: job.description
              ? job.description.slice(0, 1000)
              : null,
            organization: job.company?.display_name ?? null,
            location: locationName,
            location_type: deriveLocationType(locationName),
            url: job.redirect_url ?? null,
            image_url: null,
            source: "adzuna",
            source_id: job.id,
            starts_at: job.created ?? null,
            ends_at: null,
            salary_min: job.salary_min ?? null,
            salary_max: job.salary_max ?? null,
            salary_currency: "EUR",
            employment_type: mapEmploymentType(oppType, job.contract_time),
            tags: buildTags(
              oppType,
              job.title,
              job.description ?? "",
              locationName,
              job.category?.label
            ),
          };
        });

        const { error, data: upserted } = await supabase
          .from("opportunities")
          .upsert(rows, { onConflict: "source,source_id" })
          .select("id");

        if (error) {
          console.error("[ingest-jobs] Upsert error:", error.message);
          skipped += rows.length;
        } else {
          const count = upserted?.length ?? rows.length;
          total += count;
          console.log(
            `[ingest-jobs] Query="${query}" page=${page}: upserted ${count} records`
          );
        }

        page++;
      }
    }

    console.log(
      `[ingest-jobs] Done. Total upserted: ${total}, skipped/errored: ${skipped}`
    );

    return new Response(
      JSON.stringify({ success: true, upserted: total, skipped }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[ingest-jobs] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
