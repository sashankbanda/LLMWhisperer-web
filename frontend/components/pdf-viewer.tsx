"use client";

import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { useCallback, useEffect, useRef, useState } from "react";

// Worker from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

interface PDFViewerProps {
  fileUrl: string | null;
  highlights?: unknown;
}

function decodePdfDataUrl(dataUrl: string): Uint8Array | null {
  try {
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return null;
    const base64 = dataUrl.slice(commaIndex + 1);
    const binary = atob(base64);
    const length = binary.length;
    const buffer = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  } catch (error) {
    console.warn("Failed to decode PDF data URL", error);
    return null;
  }
}

export default function PdfViewer({ fileUrl, highlights }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scale = 1.5;

  // Load PDF
  useEffect(() => {
    if (!fileUrl) {
      setIsLoading(false);
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let source: { data: Uint8Array } | string;

        if (fileUrl.startsWith("data:application/pdf")) {
          const decoded = decodePdfDataUrl(fileUrl);
          if (!decoded) {
            throw new Error("Failed to decode PDF data");
          }
          source = { data: decoded };
        } else {
          source = fileUrl;
        }

        const pdf = await pdfjsLib.getDocument(source).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        setError("Failed to load PDF document");
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [fileUrl]);

  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any ongoing render task before starting a new one
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: unknown) {
        // Ignore cancellation errors
        if (err instanceof Error && err.message.includes("cancelled")) {
          return;
        }
        console.error("Failed to render page:", err);
      }
    };

    renderPage();

    // Cleanup: cancel render task on unmount or before re-render
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  if (!fileUrl) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No PDF preview available.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <FileText className="size-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page navigation */}
      <div className="flex shrink-0 items-center justify-center gap-4 border-b bg-muted/30 px-4 py-2">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
          Prev
        </button>
        <span className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* PDF canvas with both horizontal and vertical scroll */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto"
      >
        <div className="p-4">
          <canvas
            ref={canvasRef}
            className="block shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
