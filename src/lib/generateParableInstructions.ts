import type { AIProvider } from "./aiProvider";
import type { ExtractedSheetData } from "@/types";

const GENERATION_PROMPT_PREFIX = `Convert the extracted sheet data into copy-and-paste instructions for Parable. Use direct, clear instructions. Preserve the original sheet structure and order. Include title, sections, fields, values, blank fields, tables, columns, selected checkboxes, formatting notes, unclear items, warnings, and assumptions. Do not invent missing information. Use user context only when it clarifies the intended output. Output plain text only.

The output must follow this exact structure:

Create a Parable format using the following structure:

Title:
[Detected title]

Source notes:
- Generated from [number] uploaded image(s).
- Items marked [unclear] were unreadable or uncertain.

Sections:
[For each section, numbered:]
1. [Section name]
   - Add field: [field name]
   - Field type: [text / number / date / checkbox / dropdown / table / signature / unknown]
   - Visible value or default: [value / blank / [unclear]]
   - Notes: [placement or formatting notes if any]

Tables:
[For each table:]
- Add table: [table title]
  - Columns:
    - [Column 1]
    - [Column 2]
  - Rows/examples:
    - [Row details]

Checkboxes:
- [Checkbox label]: checked / unchecked / [unclear]

Formatting instructions:
- Preserve section order.
- Use the same field labels where readable.
- Keep blank fields available for user entry.
- Review all [unclear] items before finalizing.

---
Extracted data (JSON):
`;

export async function generateParableInstructions(
  extractedData: ExtractedSheetData,
  context: string | undefined,
  imageCount: number,
  provider: AIProvider
): Promise<string> {
  const dataJson = JSON.stringify(extractedData, null, 2);
  const contextBlock =
    context?.trim()
      ? `\n\nUser context (use only to clarify intent, do not invent data):\n${context.trim()}`
      : "";

  const prompt =
    GENERATION_PROMPT_PREFIX +
    dataJson +
    contextBlock +
    `\n\nNumber of uploaded images: ${imageCount}`;

  return provider.analyzeImages(prompt, []);
}
