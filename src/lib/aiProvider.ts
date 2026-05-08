/**
 * Isolated AI provider abstraction.
 *
 * Currently wired to Anthropic Claude (vision capable).
 * To swap providers: implement the same AIProvider interface and replace
 * the `createAnthropicProvider` export below.
 *
 * Required environment variables:
 *   ANTHROPIC_API_KEY  — Anthropic API key (server-side only, never exposed to client)
 *   ANTHROPIC_MODEL    — optional override; defaults to claude-opus-4-7
 */

import Anthropic from "@anthropic-ai/sdk";

export interface ImageInput {
  /** Base64-encoded image data */
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export interface AIProvider {
  /**
   * Send a text + images prompt and return the raw text response.
   * Pass an empty array for text-only prompts.
   * Throws on API errors, timeouts, or missing credentials.
   */
  analyzeImages(prompt: string, images: ImageInput[]): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is not set. " +
          "Copy .env.example to .env.local and add your key."
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
  }

  async analyzeImages(prompt: string, images: ImageInput[]): Promise<string> {
    const imageBlocks: Anthropic.ImageBlockParam[] = images.map((img) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mimeType,
        data: img.base64,
      },
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("AI provider returned no text in its response.");
    }
    return textBlock.text;
  }
}

/** Factory — call once per request (does not hold persistent connections). */
export function createAIProvider(): AIProvider {
  return new AnthropicProvider();
}
