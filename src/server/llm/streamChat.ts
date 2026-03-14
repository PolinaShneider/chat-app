/**
 * Server-side LLM streaming. M1: implement OpenAI stream.
 * M3: can emit redaction events in parallel.
 */

import OpenAI from "openai";
import { getEnv } from "@/server/env";

export type StreamMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Shared OpenAI client (lazy) to avoid re-creating per request. */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;
  const env = getEnv();
  openaiClient = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  return openaiClient;
}

/**
 * M1: stream assistant text deltas as plain strings.
 * - Uses OpenAI chat.completions.create with stream: true.
 * - Applies a soft timeout so requests do not hang indefinitely.
 * M3: this generator can be extended to also emit redaction metadata.
 */
export async function* streamChat(
  messages: StreamMessage[]
): AsyncGenerator<string, void, unknown> {
  const env = getEnv();
  const client = getOpenAIClient();

  // Soft timeout to prevent runaway requests; caller still controls HTTP timeout.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const stream = await client.chat.completions.create(
      {
        model: env.LLM_MODEL,
        stream: true,
        messages,
      },
      {
        signal: controller.signal,
      },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta.length > 0) {
        yield delta;
      }
    }
  } catch (error) {
    // Abort errors are treated as timeout; surface a short message once.
    if (error instanceof Error && error.name === "AbortError") {
      yield "\n[Stream cancelled: LLM request timed out]\n";
      return;
    }

    console.error("Error during OpenAI streaming", error);
    // Surface a generic failure message to the client once.
    yield "\n[Stream failed due to an unexpected server error]\n";
  } finally {
    clearTimeout(timeout);
  }
}
