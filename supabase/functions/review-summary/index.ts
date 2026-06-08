import { handleCors } from "../_shared/cors.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { callOpenAIJson, createJsonResponse } from "../_shared/openai.ts";

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const limited = await enforceRateLimit(request, { bucket: "review-summary", max: 15, windowSeconds: 60 });
  if (limited) return limited;

  const { reviews } = await request.json();
  const reviewText = Array.isArray(reviews)
    ? reviews.map((review) => `- ${review.rating}/5 ${review.comment}`).join("\n")
    : "";

  const fallback = "Reviewers consistently mention responsiveness, convenience, and a comfortable student-friendly setup.";

  try {
    const result = await callOpenAIJson({
      system:
        "Summarize property reviews for NestMate. Keep it balanced, concise, and useful.",
      prompt: `Summarize these reviews in 2 sentences:\n${reviewText}`
    });

    return createJsonResponse({ summary: result ?? fallback }, 200, request);
  } catch (_error) {
    return createJsonResponse({ summary: fallback }, 200, request);
  }
});
