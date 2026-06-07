import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  temperature: z.number().min(0).max(2).optional(),
});

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LMAO_OPENROUTER;
    if (!apiKey) {
      throw new Error("OpenRouter API key (LMAO_OPENROUTER) is not configured");
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "AI Health Assistant",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: data.messages,
        temperature: data.temperature ?? 0.4,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenRouter error", res.status, text);
      throw new Error(`AI request failed (${res.status})`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { content };
  });