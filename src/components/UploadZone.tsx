"use client";

import React, { useCallback, useRef, useState } from "react";
import { validateUploadedFiles } from "@/lib/validateUploadedFiles";
import type { UploadedImageMetadata } from "@/types";

interface UploadZoneProps {
  files: UploadedImageMetadata[];
  onChange: (files: UploadedImageMetadata[]) => void;
  onValidationError: (errors: string[]) => void;
  disabled?: boolean;
}

export default function UploadZone({
  files,
  onChange,
  onValidationError,
  disabled = false,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const merged = [...files.map((f) => f.file), ...incoming];
      const result = validateUploadedFiles(merged);
      if (!result.valid) {
        onValidationError(result.errors.map((e) => (e.file ? `${e.file}: ${e.reason}` : e.reason)));
        return;
      }

      // Revoke old preview URLs before replacing them
      // (we only revoke for files that are being replaced; kept files keep their URL)
      const existingNames = new Set(files.map((f) => f.file.name + f.file.size));
      const newMeta: UploadedImageMetadata[] = incoming
        .filter((f) => !existingNames.has(f.name + f.size))
        .map((file, idx) => ({
          file,
          previewUrl: URL.createObjectURL(file),
          order: files.length + idx + 1,
        }));

      onChange([...files, ...newMeta]);
      onValidationError([]);
    },
    [files, onChange, onValidationError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) addFiles(picked);
    // Reset so the same file can be re-added after removal
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div
      role="region"
      aria-label="File upload area"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={[
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer select-none",
        isDragOver && !disabled
          ? "border-brand-500 bg-brand-50"
          : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        aria-label="Upload format sheet photos"
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
      />

      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
        <svg
          className="h-6 w-6 text-brand-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <p className="text-sm font-medium text-slate-700">
        Drag photos here, or{" "}
        <span className="text-brand-600 underline underline-offset-2">browse</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">
        JPEG, PNG, or WebP — up to 5 files, 10 MB each
      </p>
    </div>
  );
}
