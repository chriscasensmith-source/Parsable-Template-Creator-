# Parsable Template Creator

Upload photos of paper format sheets and get clean, copy-and-paste instructions ready to use in Parable.

## What it does

1. User uploads 1–5 photos of paper format sheets (JPEG, PNG, or WebP, up to 10 MB each).
2. User optionally adds context notes.
3. App sends the images to Claude (Anthropic) via a secure server-side API route.
4. Claude extracts all visible text, fields, tables, checkboxes, and layout information.
5. Claude converts the extracted data into structured Parable-ready plain text instructions.
6. User can edit the output, then copy it with one click to paste into Parable.

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Provider**: Anthropic Claude (vision) via `@anthropic-ai/sdk`

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key — get one at https://console.anthropic.com/ |
| `ANTHROPIC_MODEL` | No | `claude-opus-4-7` | Override the Claude model used for analysis |

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
# then edit .env.local
```

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key
cp .env.example .env.local
# Edit .env.local and set ANTHROPIC_API_KEY

# 3. Start the dev server
npm run dev
# Open http://localhost:3000
```

## Upload limits

| Limit | Value |
|---|---|
| Max files per request | 5 |
| Max file size | 10 MB |
| Supported types | JPEG, PNG, WebP |

## API

### `POST /api/generate-parable-instructions`

Accepts `multipart/form-data`:

| Field | Type | Description |
|---|---|---|
| `files` | File (multiple) | Format sheet images |
| `context` | string (optional) | Additional context for the AI |

**Success response:**
```json
{
  "success": true,
  "extractedData": { "title": "...", "pages": [...], "warnings": [...], "assumptions": [...] },
  "instructions": "...",
  "warnings": [],
  "error": null
}
```

**Failure response:**
```json
{
  "success": false,
  "extractedData": null,
  "instructions": "",
  "warnings": [],
  "error": "Helpful error message"
}
```

## Manual testing checklist

Since no automated test framework is set up, verify the following manually:

### Upload validation
- [ ] Uploading 0 files shows "No files selected" error
- [ ] Uploading 6+ files shows "Too many files" error
- [ ] Uploading a PDF or `.docx` shows "Unsupported type" error
- [ ] Uploading a file over 10 MB shows "File too large" error
- [ ] Valid JPEG/PNG/WebP files are accepted

### UI – upload zone
- [ ] Drag-and-drop onto the drop zone adds files
- [ ] Clicking the zone opens the file picker
- [ ] Duplicate files (same name + size) are not added twice
- [ ] Image thumbnails appear for each uploaded file
- [ ] File name and size are displayed
- [ ] "Image N" badge shows upload order
- [ ] Remove button removes the file and revokes its object URL (no memory leak)
- [ ] After removal, image order renumbers correctly

### Generate button
- [ ] Button is disabled when no files are uploaded
- [ ] Button shows spinner and "Analyzing images…" during request
- [ ] Button is disabled during loading

### API key missing
- [ ] When `ANTHROPIC_API_KEY` is not set, API returns a clear 500 error
- [ ] Error is displayed on the page

### Success flow
- [ ] Generated instructions appear in the textarea
- [ ] Success status message is shown
- [ ] Textarea is editable
- [ ] Edits to the textarea are reflected in the copy button output

### Copy button
- [ ] Clicking "Copy Instructions" copies the **current** textarea content (including any edits)
- [ ] Button shows "Copied!" confirmation for ~2 seconds

### Warnings
- [ ] If the AI returns warnings (e.g., unreadable text), they appear in the warning banner
- [ ] `[unclear]` markers appear in the instructions for unreadable content

### Multiple images
- [ ] Uploading 3 images produces instructions referencing all 3 pages in order
- [ ] Source notes show the correct image count

### Error states
- [ ] Network failure shows a clear error message
- [ ] Server 500 shows a clear error message

### Memory / cleanup
- [ ] Object URLs are revoked when files are removed
- [ ] Object URLs are revoked when the page unmounts (navigate away and back)

## Project structure

```
src/
  app/
    api/
      generate-parable-instructions/
        route.ts          # POST endpoint
    layout.tsx            # Root layout
    page.tsx              # Main page
    globals.css           # Tailwind imports
  components/
    UploadZone.tsx         # Drag-and-drop upload area
    FilePreview.tsx        # Image preview card
    InstructionsOutput.tsx # Editable output + copy button
    StatusMessage.tsx      # Error/warning/info/success banners
  lib/
    aiProvider.ts          # Isolated Anthropic abstraction (swap-friendly)
    extractSheetData.ts    # OCR/extraction helper
    generateParableInstructions.ts  # Instruction generation helper
    validateUploadedFiles.ts        # Client + server validation
  types/
    index.ts               # Shared TypeScript types
```

## Swapping the AI provider

All AI calls flow through the `AIProvider` interface in `src/lib/aiProvider.ts`. To use a different provider:

1. Implement the `AIProvider` interface.
2. Replace the `createAIProvider()` factory return value.
3. Update `.env.example` with the new provider's required variables.

No other files need changing.
