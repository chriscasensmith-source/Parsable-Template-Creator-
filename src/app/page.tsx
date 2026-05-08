"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import UploadZone from "@/components/UploadZone";
import FilePreview from "@/components/FilePreview";
import InstructionsOutput from "@/components/InstructionsOutput";
import StatusMessage from "@/components/StatusMessage";
import type { GenerateParableInstructionsResponse, UploadedImageMetadata } from "@/types";

type AppState = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [files, setFiles] = useState<UploadedImageMetadata[]>([]);
  const [context, setContext] = useState("");
  const [appState, setAppState] = useState<AppState>("idle");
  const [instructions, setInstructions] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Track object URLs created so we can revoke them when components unmount
  const revokeQueue = useRef<string[]>([]);

  const revokeAll = useCallback(() => {
    for (const url of revokeQueue.current) {
      URL.revokeObjectURL(url);
    }
    revokeQueue.current = [];
  }, []);

  // Revoke all on unmount
  useEffect(() => () => revokeAll(), [revokeAll]);

  const handleFilesChange = useCallback((next: UploadedImageMetadata[]) => {
    // Track new URLs for cleanup
    const existing = new Set(files.map((f) => f.previewUrl));
    for (const f of next) {
      if (!existing.has(f.previewUrl)) {
        revokeQueue.current.push(f.previewUrl);
      }
    }
    setFiles(next);
    setValidationErrors([]);
  }, [files]);

  const handleRemoveFile = (index: number) => {
    const removed = files[index];
    // Revoke immediately on removal
    URL.revokeObjectURL(removed.previewUrl);
    revokeQueue.current = revokeQueue.current.filter((u) => u !== removed.previewUrl);

    const updated = files
      .filter((_, i) => i !== index)
      .map((f, i) => ({ ...f, order: i + 1 }));
    setFiles(updated);
    setValidationErrors([]);
  };

  const handleGenerate = async () => {
    if (files.length === 0 || appState === "loading") return;

    setAppState("loading");
    setErrorMessages([]);
    setWarnings([]);
    setInstructions("");

    const body = new FormData();
    for (const meta of files) {
      body.append("files", meta.file);
    }
    if (context.trim()) {
      body.append("context", context.trim());
    }

    try {
      const res = await fetch("/api/generate-parable-instructions", {
        method: "POST",
        body,
      });

      const data: GenerateParableInstructionsResponse = await res.json();

      if (data.success) {
        setInstructions(data.instructions);
        setWarnings(data.warnings ?? []);
        setAppState("success");
      } else {
        setErrorMessages([data.error ?? "An unknown error occurred."]);
        if (data.warnings?.length) setWarnings(data.warnings);
        setAppState("error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessages([`Network error: ${msg}`]);
      setAppState("error");
    }
  };

  const isGenerateDisabled = files.length === 0 || appState === "loading";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Parsable Template Creator
          </h1>
          <p className="text-sm text-slate-600">
            Upload photos of paper format sheets and get copy-and-paste instructions
            ready to use in Parable.
          </p>
        </header>

        {/* Upload section */}
        <section aria-labelledby="upload-heading" className="space-y-4">
          <h2 id="upload-heading" className="text-base font-semibold text-slate-800">
            1. Upload Format Sheet Photos
          </h2>

          <UploadZone
            files={files}
            onChange={handleFilesChange}
            onValidationError={setValidationErrors}
            disabled={appState === "loading"}
          />

          {validationErrors.length > 0 && (
            <StatusMessage variant="error" messages={validationErrors} />
          )}

          {files.length > 0 && (
            <ul className="space-y-2" aria-label="Uploaded files">
              {files.map((meta, idx) => (
                <li key={meta.previewUrl}>
                  <FilePreview
                    meta={meta}
                    onRemove={() => handleRemoveFile(idx)}
                    disabled={appState === "loading"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Context section */}
        <section aria-labelledby="context-heading" className="space-y-2">
          <h2 id="context-heading" className="text-base font-semibold text-slate-800">
            2. Add Context <span className="text-xs font-normal text-slate-500">(optional)</span>
          </h2>
          <textarea
            id="context-input"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe the purpose of this sheet, its department, or any details that help clarify ambiguous fields…"
            rows={3}
            disabled={appState === "loading"}
            aria-label="Optional context notes for the AI"
            className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
          />
        </section>

        {/* Generate button */}
        <section aria-labelledby="generate-heading" className="space-y-3">
          <h2 id="generate-heading" className="sr-only">Generate</h2>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            aria-busy={appState === "loading"}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              isGenerateDisabled
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
            ].join(" ")}
          >
            {appState === "loading" ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Analyzing images…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.338 2.698H4.136c-1.368 0-2.337-1.698-1.338-2.698L4 15.3" />
                </svg>
                Generate Instructions
              </>
            )}
          </button>

          {appState === "loading" && (
            <StatusMessage
              variant="info"
              messages={["Analyzing your images and extracting sheet data. This may take 20–60 seconds."]}
            />
          )}
        </section>

        {/* Error state */}
        {appState === "error" && errorMessages.length > 0 && (
          <StatusMessage variant="error" messages={errorMessages} />
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <StatusMessage
            variant="warning"
            messages={[
              "Some content could not be fully read. Review [unclear] items in the instructions.",
              ...warnings,
            ]}
          />
        )}

        {/* Output */}
        {appState === "success" && instructions && (
          <>
            <StatusMessage
              variant="success"
              messages={["Instructions generated successfully. Edit below, then copy to Parable."]}
            />
            <InstructionsOutput
              instructions={instructions}
              onChange={setInstructions}
            />
          </>
        )}
      </div>
    </main>
  );
}
