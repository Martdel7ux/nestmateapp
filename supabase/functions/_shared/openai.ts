import { corsHeaders, corsHeadersFor } from "./cors.ts";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

export async function createJsonResponse(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(request ? corsHeadersFor(request) : corsHeaders),
      "Content-Type": "application/json"
    }
  });
}

export async function callOpenAIJson(input: {
  system: string;
  prompt: string;
  response_format?: { type: string };
  temperature?: number;
}) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: input.temperature ?? 0.3,
      text: input.response_format,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: input.system }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: input.prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  return payload.output_text as string;
}

export async function callOpenAIStream(messages: Array<{ role: string; content: string }>, system: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  return fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      stream: true,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: system }]
        },
        ...messages.map((message) => ({
          role: message.role,
          content: [{ type: "input_text", text: message.content }]
        }))
      ]
    })
  });
}

export function fakeSseStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(" ");

  return new ReadableStream({
    start(controller) {
      let index = 0;
      const timer = setInterval(() => {
        if (index >= chunks.length) {
          controller.enqueue(encoder.encode("event: done\ndata: [DONE]\n\n"));
          clearInterval(timer);
          controller.close();
          return;
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: `${chunks[index]} ` })}\n\n`)
        );
        index += 1;
      }, 35);
    }
  });
}
