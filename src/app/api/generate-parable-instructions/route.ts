import { NextRequest, NextResponse } from "next/server";
import { validateServerFiles } from "@/lib/validateUploadedFiles";
import { createAIProvider } from "@/lib/aiProvider";
import { extractSheetDataFromImages } from "@/lib/extractSheetData";
import { generateParableInstructions } from "@/lib/generateParableInstructions";
import type { GenerateParableInstructionsResponse } from "@/types";
import type { ImageInput } from "@/lib/aiProvider";

// Tell Next.js not to parse the body — we handle multipart/form-data ourselves
export const runtime = "nodejs";

function errorResponse(
  message: string,
  status = 400
): NextResponse<GenerateParableInstructionsResponse> {
  return NextResponse.json(
    {
      success: false,
      extractedData: null,
      instructions: "",
      warnings: [],
      error: message,
    },
    { status }
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateParableInstructionsResponse>> {
  // ── 1. Parse multipart/form-data ─────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Failed to parse multipart form data.", 400);
  }

  const rawFiles = formData.getAll("files") as File[];
  const context = (formData.get("context") as string | null) ?? "";

  // ── 2. Server-side file validation ───────────────────────────────────────
  const serverInputs = rawFiles.map((f) => ({
    name: f.name,
    size: f.size,
    mimeType: f.type,
  }));

  const validation = validateServerFiles(serverInputs);
  if (!validation.valid) {
    const message = validation.errors.map((e) => e.reason).join(" ");
    return errorResponse(message, 422);
  }

  // ── 3. Convert files to base64 ImageInput[] ──────────────────────────────
  let images: ImageInput[];
  try {
    images = await Promise.all(
      rawFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          base64,
          mimeType: file.type as ImageInput["mimeType"],
        };
      })
    );
  } catch {
    return errorResponse("Failed to read uploaded files.", 500);
  }

  // ── 4. Build AI provider ─────────────────────────────────────────────────
  let provider;
  try {
    provider = createAIProvider();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse(`AI provider configuration error: ${msg}`, 500);
  }

  // ── 5. Extract sheet data ────────────────────────────────────────────────
  let extractedData;
  try {
    extractedData = await extractSheetDataFromImages(images, provider);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse(`Extraction failed: ${msg}`, 500);
  }

  // ── 6. Generate Parable instructions ────────────────────────────────────
  let instructions: string;
  try {
    instructions = await generateParableInstructions(
      extractedData,
      context,
      images.length,
      provider
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Return partial success — we have extracted data even if generation failed
    return NextResponse.json({
      success: false,
      extractedData,
      instructions: "",
      warnings: [],
      error: `Instruction generation failed: ${msg}`,
    });
  }

  // ── 7. Collect warnings ──────────────────────────────────────────────────
  const warnings = extractedData.warnings.map(
    (w) =>
      w.pageNumber != null
        ? `Page ${w.pageNumber}: ${w.message}`
        : w.message
  );

  return NextResponse.json({
    success: true,
    extractedData,
    instructions,
    warnings,
    error: null,
  });
}
