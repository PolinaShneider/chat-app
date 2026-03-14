/**
 * Server-side LLM streaming. M1: implement OpenAI stream.
 * M3: can emit redaction events in parallel.
 */

import { getEnv } from "@/server/env";

export type StreamMessage = {
  role: "user" | "assistant";
  content: string;
};

/** M1: stream assistant text. M3: may also yield redaction spans. */
export async function* streamChat(
  _messages: StreamMessage[]
): AsyncGenerator<string, void, unknown> {
  void getEnv(); // ensure env is valid
  // TODO M1: call OpenAI with stream: true, yield delta content
  yield "";
}
