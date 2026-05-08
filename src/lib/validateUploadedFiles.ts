export const MAX_FILES = 5;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface FileValidationError {
  file: string;
  reason: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client-side validation. Pass File[] from an input or drop event.
 */
export function validateUploadedFiles(files: File[]): FileValidationResult {
  const errors: FileValidationError[] = [];

  if (files.length === 0) {
    errors.push({ file: "", reason: "No files selected." });
    return { valid: false, errors };
  }

  if (files.length > MAX_FILES) {
    errors.push({
      file: "",
      reason: `Too many files. Maximum is ${MAX_FILES}; you uploaded ${files.length}.`,
    });
    return { valid: false, errors };
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
      errors.push({
        file: file.name,
        reason: `Unsupported type "${file.type}". Accepted: JPEG, PNG, WebP.`,
      });
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({
        file: file.name,
        reason: `File too large (${formatBytes(file.size)}). Maximum is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Server-side validation for raw Buffer + metadata tuples.
 */
export interface ServerFileInput {
  name: string;
  size: number;
  mimeType: string;
}

export function validateServerFiles(files: ServerFileInput[]): FileValidationResult {
  const errors: FileValidationError[] = [];

  if (files.length === 0) {
    errors.push({ file: "", reason: "No files uploaded." });
    return { valid: false, errors };
  }

  if (files.length > MAX_FILES) {
    errors.push({
      file: "",
      reason: `Too many files. Maximum is ${MAX_FILES}; received ${files.length}.`,
    });
    return { valid: false, errors };
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType as AllowedMimeType)) {
      errors.push({
        file: file.name,
        reason: `Unsupported type "${file.mimeType}". Accepted: image/jpeg, image/png, image/webp.`,
      });
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({
        file: file.name,
        reason: `File too large (${formatBytes(file.size)}). Maximum is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
