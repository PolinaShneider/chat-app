import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/server/env";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

type OpenAIChatResponse = {
  choices?: { message?: { content?: string | null } | null }[];
  error?: { message?: string; type?: string; code?: string | number } | string;
};

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { prompt } = parsed.data;

  const env = getEnv();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorBody: OpenAIChatResponse | undefined;
      try {
        errorBody = (await response.json()) as OpenAIChatResponse;
      } catch {
        // ignore parse errors
      }

      return NextResponse.json(
        {
          error: "LLM request failed",
          details: errorBody?.error ?? { status: response.status },
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const content =
      data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ content });
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "LLM request timed out" },
        { status: 504 },
      );
    }

    console.error("Error calling OpenAI", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}

