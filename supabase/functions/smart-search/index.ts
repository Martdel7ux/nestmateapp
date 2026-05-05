import { handleCors } from "../_shared/cors.ts";
import { callOpenAIJson, createJsonResponse } from "../_shared/openai.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const { query } = await request.json();
  const normalized = String(query ?? "").toLowerCase();

  const fallback = {
    city: normalized.includes("nicosia")
      ? "Nicosia"
      : normalized.includes("limassol")
        ? "Limassol"
        : null,
    max_price: normalized.includes("cheap") ? 600 : null,
    bedrooms: normalized.includes("studio") ? 1 : null,
    student_type: normalized.includes("erasmus") ? "erasmus" : null
  };

  try {
    const result = await callOpenAIJson({
      system:
        "You convert NestMate property search requests into JSON filters. Return only JSON.",
      prompt: `User query: ${query}\nReturn keys: city, max_price, min_price, bedrooms, bathrooms, student_type, summary.`,
      response_format: { type: "json_object" }
    });

    return createJsonResponse(result ? JSON.parse(result) : fallback);
  } catch (_error) {
    return createJsonResponse(fallback);
  }
});
