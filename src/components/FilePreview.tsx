"use client";

import React from "react";
import type { UploadedImageMetadata } from "@/types";

interface FilePreviewProps {
  meta: UploadedImageMetadata;
  onRemove: () => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({ meta, onRemove, disabled = false }: FilePreviewProps) {
  return (
    <div className="relative flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={meta.previewUrl}
        alt={`Preview of ${meta.file.name}`}
        className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
      />

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-slate-800"
          title={meta.file.name}
        >
          {meta.file.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatBytes(meta.file.size)}
        </p>
        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          Image {meta.order}
        </span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${meta.file.name}`}
        className="flex-shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
