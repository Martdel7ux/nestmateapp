import { handleCors } from "../_shared/cors.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { callOpenAIJson, createJsonResponse } from "../_shared/openai.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const limited = await enforceRateLimit(request, { bucket: "generate-description", max: 15, windowSeconds: 60 });
  if (limited) return limited;

  const payload = await request.json();
  const fallback = `Student-friendly ${payload.bedrooms}-bedroom property in ${payload.city} with ${payload.bathrooms} bathroom(s), ${payload.available_to} availability, and convenient access to local universities and transport.`;

  try {
    const result = await callOpenAIJson({
      system:
        "You write polished property descriptions for a student accommodation app in Cyprus.",
      prompt: `Write a concise premium listing description from this JSON: ${JSON.stringify(payload)}`
    });

    return createJsonResponse({ description: result ?? fallback }, 200, request);
  } catch (_error) {
    return createJsonResponse({ description: fallback }, 200, request);
  }
});
