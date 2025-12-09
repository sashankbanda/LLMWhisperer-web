"use client";

import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/button";
// import PDFViewer from "@/components/pdf-viewer";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/pdf-viewer"), {
  ssr: false,
});

import ImageViewer from "@/components/image-viewer";
import TextPanel from "@/components/text-panel";
import {
  EXTRACTION_FILE_STORAGE_KEY,
  EXTRACTION_STORAGE_KEY,
} from "@/lib/constants";



type StoredExtraction = {
  text: string;
  highlights?: unknown;
  whisper_hash?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  storedAt?: number;
};

type ViewerState = StoredExtraction & {
  fileDataUrl: string | null;
};

const EMPTY_STATE_CLASS =
  "flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border bg-background/80 p-10 text-center";

function formatMeta(details: StoredExtraction): string {
  const parts: string[] = [];

  if (details.mimeType) {
    parts.push(details.mimeType.replace(/application\//, ""));
  }

  if (typeof details.fileSize === "number") {
    const size = details.fileSize;
    const units = ["B", "KB", "MB", "GB"] as const;
    const exponent = Math.min(
      Math.floor(Math.log(size || 1) / Math.log(1024)),
      units.length - 1
    );
    const value = size / Math.pow(1024, exponent);
    parts.push(`${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`);
  }

  if (details.storedAt) {
    const formatted = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(details.storedAt);
    parts.push(formatted);
  }

  return parts.join(" • ");
}

export default function ViewerPage() {
  const [state, setState] = useState<ViewerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EXTRACTION_STORAGE_KEY);
      if (!stored) {
        setState(null);
        return;
      }

      const parsed = JSON.parse(stored) as StoredExtraction;
      const fileData = sessionStorage.getItem(EXTRACTION_FILE_STORAGE_KEY);

      setState({
        ...parsed,
        fileDataUrl: fileData ?? null,
      });
    } catch (error) {
      console.error("Failed to parse stored extraction", error);
      setState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const metadata = useMemo(() => (state ? formatMeta(state) : ""), [state]);

  const handleReset = () => {
    localStorage.removeItem(EXTRACTION_STORAGE_KEY);
    sessionStorage.removeItem(EXTRACTION_FILE_STORAGE_KEY);
    setState(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-6">
        <div className={EMPTY_STATE_CLASS}>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Preparing document viewer…</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-6">
        <div className={EMPTY_STATE_CLASS}>
          <p className="text-lg font-semibold">No document loaded</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload a PDF to extract the text and highlights, then review it here.
          </p>
          <Button onClick={() => router.push("/upload")} size="lg">
            Upload a document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => router.push("/upload")}
            >
              <ArrowLeft className="size-4" />
              Upload another file
            </Button>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">
              {state.fileName ?? "Uploaded document"}
            </span>
            {metadata && (
              <span className="text-xs text-muted-foreground">{metadata}</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Clear data
          </Button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 gap-4 px-4 py-4 lg:px-6">
        {/* PDF Preview Panel - fixed size with both scrolls */}
        <section className="flex flex-[2] min-h-0 min-w-0 flex-col rounded-2xl border bg-background shadow-sm">
          <div className="shrink-0 border-b px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Document preview
            </h2>
          </div>
          <div className="flex-1 min-h-0 min-w-0 overflow-auto">
            {state.mimeType === "application/pdf" ? (
              <PDFViewer fileUrl={state.fileDataUrl} highlights={state.highlights} />
            ) : state.mimeType?.startsWith("image/") ? (
              <ImageViewer fileUrl={state.fileDataUrl!} />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground p-6">
                No preview available for this file type.
              </div>
            )}              
          </div>
        </section>

        {/* Text Panel - fixed size with both scrolls */}
        <aside className="flex flex-1 min-h-0 min-w-0 flex-col rounded-2xl border bg-background shadow-sm">
          <div className="shrink-0 border-b px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Extracted text
            </h2>
          </div>
          <div className="flex-1 min-h-0 min-w-0 overflow-auto">
            <TextPanel text={state.text} />
          </div>
        </aside>
      </main>
    </div>
  );
}
