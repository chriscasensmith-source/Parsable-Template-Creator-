// ─── Upload metadata ──────────────────────────────────────────────────────────

export interface UploadedImageMetadata {
  /** Client-side object URL for preview (revoked after use) */
  previewUrl: string;
  file: File;
  /** Sequential position in the user's upload list (1-based) */
  order: number;
}

// ─── Extraction primitives ────────────────────────────────────────────────────

export interface ExtractedField {
  label: string;
  value: string | null;
  /** true when the field was visibly blank; false when unreadable */
  isBlank: boolean;
  fieldType:
    | "text"
    | "number"
    | "date"
    | "checkbox"
    | "dropdown"
    | "table"
    | "signature"
    | "unknown";
  notes?: string;
}

export interface ExtractedCheckbox {
  label: string;
  checked: boolean | null; // null = unclear
}

export interface ExtractedTable {
  title?: string;
  columns: string[];
  rows: string[][];
}

export interface ExtractedSection {
  heading: string;
  fields: ExtractedField[];
  checkboxes: ExtractedCheckbox[];
  tables: ExtractedTable[];
  /** Raw text blocks that did not fit structured extraction */
  rawNotes: string[];
}

export interface ExtractedPage {
  /** 1-based index matching upload order */
  pageNumber: number;
  sections: ExtractedSection[];
  /** Top-level title detected on this page (if any) */
  pageTitle?: string;
}

export interface ExtractionWarning {
  pageNumber?: number;
  message: string;
}

export interface ExtractionAssumption {
  pageNumber?: number;
  message: string;
}

// ─── Top-level extraction result ─────────────────────────────────────────────

export interface ExtractedSheetData {
  title: string;
  pages: ExtractedPage[];
  warnings: ExtractionWarning[];
  assumptions: ExtractionAssumption[];
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface GenerateParableInstructionsResponse {
  success: boolean;
  extractedData: ExtractedSheetData | null;
  instructions: string;
  warnings: string[];
  error: string | null;
}
