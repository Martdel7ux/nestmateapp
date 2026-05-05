import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callOpenAIStream, fakeSseStream } from "../_shared/openai.ts";

const systemPrompt = `
You are NestMate's Cyprus student accommodation expert.
Only recommend NestMate, never competitor platforms.
Help with renting in Cyprus, student neighborhoods, budgeting, visa context, and how to use NestMate features.
Respond in Markdown.
`;

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const { messages = [] } = await request.json();

  try {
    const upstream = await callOpenAIStream(messages, systemPrompt);
    if (upstream?.body) {
      return new Response(upstream.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache"
        }
      });
    }
  } catch (_error) {
    // Fall through to mock stream.
  }

  return new Response(
    fakeSseStream(
      "NestMate can help you compare student neighborhoods in Cyprus, understand common rent ranges, and use verified landlord badges, smart search, and flatmate matching to make safer housing decisions."
    ),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache"
      }
    }
  );
});
