import { handleCors } from "../_shared/cors.ts";
import { callOpenAIJson, createJsonResponse } from "../_shared/openai.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const payload = await request.json();
  const fallback = `Student-friendly ${payload.bedrooms}-bedroom property in ${payload.city} with ${payload.bathrooms} bathroom(s), ${payload.available_to} availability, and convenient access to local universities and transport.`;

  try {
    const result = await callOpenAIJson({
      system:
        "You write polished property descriptions for a student accommodation app in Cyprus.",
      prompt: `Write a concise premium listing description from this JSON: ${JSON.stringify(payload)}`
    });

    return createJsonResponse({ description: result ?? fallback });
  } catch (_error) {
    return createJsonResponse({ description: fallback });
  }
});
