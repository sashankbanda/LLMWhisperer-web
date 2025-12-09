"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, UploadCloud, XCircle } from "lucide-react";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { cn } from "@/lib/utils";
import {
  EXTRACTION_FILE_STORAGE_KEY,
  EXTRACTION_STORAGE_KEY,
} from "@/lib/constants";

type UploadResponse = {
  text: string;
  highlights?: unknown;
  whisper_hash?: string;
};

// const ACCEPTED_MIME_TYPES = ["application/pdf"];
// Allow everything
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/tiff",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / Math.pow(1024, exponent);
  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function UploadBox() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const clearSelection = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const validateFile = useCallback((candidate: File | null) => {
    if (!candidate) {
      return "";
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`;
    }

    if (candidate.type && !ACCEPTED_MIME_TYPES.includes(candidate.type)) {
      return "Only PDF documents are supported right now.";
    }

    return "";
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const nextFile = files?.[0] ?? null;
      const validationMessage = validateFile(nextFile);

      if (validationMessage) {
        setError(validationMessage);
        setFile(null);
        return;
      }

      setError(null);
      setFile(nextFile);
    },
    [validateFile]
  );

  const onDrop = useCallback<React.DragEventHandler<HTMLLabelElement>>(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback<React.DragEventHandler<HTMLLabelElement>>((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback<React.DragEventHandler<HTMLLabelElement>>(() => {
    setIsDragging(false);
  }, []);

  const upload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8003/extract/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to process the document.");
      }

      const result = (await response.json()) as UploadResponse;

      const payload = {
        ...result,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storedAt: Date.now(),
      };

      localStorage.setItem(EXTRACTION_STORAGE_KEY, JSON.stringify(payload));

      try {
        const dataUrl = await readFileAsDataUrl(file);
        sessionStorage.setItem(EXTRACTION_FILE_STORAGE_KEY, dataUrl);
      } catch (storageError) {
        console.warn("Unable to cache file preview", storageError);
        sessionStorage.removeItem(EXTRACTION_FILE_STORAGE_KEY);
      }

      router.push("/viewer");
    } catch (uploadError) {
      console.error(uploadError);
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Something went wrong while uploading.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [file, router]);

  return (
    <div className="flex w-full flex-col gap-6">
      <label
        htmlFor="file-upload"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 p-8 text-center transition",
          isDragging
            ? "border-primary bg-primary/10"
            : "hover:border-primary/80 hover:bg-muted/60"
        )}
      >
        <UploadCloud className="mb-4 size-10 text-primary" />
        <div className="space-y-2">
          <p className="text-lg font-semibold">Drop your PDF here</p>
          <p className="text-sm text-muted-foreground">
            Drag and drop a document, or click to browse.
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum size {formatFileSize(MAX_FILE_SIZE_BYTES)}
          </p>
        </div>
        <Input
          ref={inputRef}
          id="file-upload"
          type="file"
          accept=""
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>

      {file && (
        <div className="flex items-start justify-between gap-3 rounded-lg border bg-background p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <FileUp className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium leading-none">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearSelection}
            className="text-muted-foreground"
          >
            <XCircle className="size-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <XCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          onClick={upload}
          disabled={!file || isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud className="size-4" />
              Upload and Extract
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          Browse Files
        </Button>
      </div>
    </div>
  );
}
