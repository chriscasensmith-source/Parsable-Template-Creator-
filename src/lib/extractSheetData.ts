import type { AIProvider, ImageInput } from "./aiProvider";
import type { ExtractedSheetData } from "@/types";

const EXTRACTION_PROMPT = `You are analyzing uploaded photos of paper format sheets. Extract all visible text and layout information. Preserve uploaded image order and preserve order from top to bottom and left to right. Identify document title, headings, sections, field labels, field values, blank fields, tables, table columns, table rows, checkboxes, selected options, option lists, handwritten notes, repeated patterns, formatting notes, unclear areas, warnings, and assumptions. Do not invent missing information. Mark unreadable content as [unclear]. Return structured JSON only.

Return ONLY valid JSON matching this exact TypeScript shape (no markdown fences, no explanation):
{
  "title": string,
  "pages": [
    {
      "pageNumber": number,
      "pageTitle": string | null,
      "sections": [
        {
          "heading": string,
          "fields": [
            {
              "label": string,
              "value": string | null,
              "isBlank": boolean,
              "fieldType": "text"|"number"|"date"|"checkbox"|"dropdown"|"table"|"signature"|"unknown",
              "notes": string | null
            }
          ],
          "checkboxes": [
            { "label": string, "checked": boolean | null }
          ],
          "tables": [
            {
              "title": string | null,
              "columns": string[],
              "rows": string[][]
            }
          ],
          "rawNotes": string[]
        }
      ]
    }
  ],
  "warnings": [
    { "pageNumber": number | null, "message": string }
  ],
  "assumptions": [
    { "pageNumber": number | null, "message": string }
  ]
}`;

function sanitizeExtractedData(raw: unknown): ExtractedSheetData {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI response was not a JSON object.");
  }

  const obj = raw as Record<string, unknown>;

  return {
    title: typeof obj.title === "string" ? obj.title : "Untitled Sheet",
    pages: Array.isArray(obj.pages) ? obj.pages : [],
    warnings: Array.isArray(obj.warnings) ? obj.warnings : [],
    assumptions: Array.isArray(obj.assumptions) ? obj.assumptions : [],
  };
}

export async function extractSheetDataFromImages(
  images: ImageInput[],
  provider: AIProvider
): Promise<ExtractedSheetData> {
  const rawText = await provider.analyzeImages(EXTRACTION_PROMPT, images);

  // Strip markdown code fences if the model wrapped its JSON
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "AI provider returned invalid JSON during extraction. Raw response: " +
        cleaned.slice(0, 300)
    );
  }

  return sanitizeExtractedData(parsed);
}
