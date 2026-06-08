import { handleCors } from "../_shared/cors.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { callOpenAIJson, createJsonResponse } from "../_shared/openai.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const limited = await enforceRateLimit(request, { bucket: "translate-message", max: 40, windowSeconds: 60 });
  if (limited) return limited;

  const { content, target_language = "English" } = await request.json();
  const fallback = `${content}`;

  try {
    const result = await callOpenAIJson({
      system:
        "Translate NestMate chat messages while preserving tone and keeping the result concise.",
      prompt: `Translate this message to ${target_language}: ${content}`
    });

    return createJsonResponse({ translation: result ?? fallback }, 200, request);
  } catch (_error) {
    return createJsonResponse({ translation: fallback }, 200, request);
  }
});
