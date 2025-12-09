"use client";

import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import HighlightOverlay from "@/components/highlight-overlay";

import "react-pdf/dist/Page/TextLayer.css";

type NormalizedHighlight = {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PageMetrics = {
  originalWidth: number;
  originalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
};

const PDF_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

if (typeof window !== "undefined" && pdfjs.GlobalWorkerOptions.workerSrc !== PDF_WORKER_SRC) {
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
}

function normalizeHighlights(input: unknown): NormalizedHighlight[] {
  if (!input) return [];

  const normalized: NormalizedHighlight[] = [];

  const entries = Array.isArray(input)
    ? input.map((value, index) => [String(index), value] as const)
    : typeof input === "object" && input !== null
      ? Object.entries(input as Record<string, unknown>)
      : [];

  for (const [key, value] of entries) {
    if (typeof value !== "object" || value === null) continue;

    const highlight = value as Record<string, unknown>;
    const pageNumber = Number(highlight.page_number ?? highlight.page ?? 1) || 1;

    const boxesSource = highlight.bounding_boxes ?? highlight.boxes ?? highlight.box;
    const boxes = Array.isArray(boxesSource)
      ? boxesSource
      : boxesSource
        ? [boxesSource]
        : [highlight];

    boxes.forEach((box, index) => {
      if (typeof box !== "object" || box === null) return;
      const record = box as Record<string, unknown>;

      const readNumber = (candidate: unknown): number | null => {
        if (typeof candidate === "number" && Number.isFinite(candidate)) {
          return candidate;
        }
        if (typeof candidate === "string" && candidate.trim() !== "") {
          const parsed = Number(candidate);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
        return null;
      };

      const xCandidate =
        record.base_x ??
        record.x ??
        record.left ??
        record.start_x ??
        record.startX;
      const yCandidate =
        record.base_y ??
        record.y ??
        record.top ??
        record.start_y ??
        record.startY;
      const widthCandidate =
        record.width ??
        record.w ??
        (typeof record.size === "object" && record.size !== null
          ? (record.size as Record<string, unknown>).width
          : undefined);
      const heightCandidate =
        record.height ??
        record.h ??
        (typeof record.size === "object" && record.size !== null
          ? (record.size as Record<string, unknown>).height
          : undefined);

      const x = readNumber(xCandidate) ?? 0;
      const y = readNumber(yCandidate) ?? 0;
      const width = readNumber(widthCandidate) ?? 0;
      const height = readNumber(heightCandidate) ?? 0;

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      normalized.push({
        id: `${key}-${index}`,
        pageNumber,
        x,
        y,
        width,
        height,
      });
    });
  }

  return normalized;
}

function groupByPage(highlights: NormalizedHighlight[]): Record<number, NormalizedHighlight[]> {
  return highlights.reduce<Record<number, NormalizedHighlight[]>>((acc, item) => {
    if (!acc[item.pageNumber]) {
      acc[item.pageNumber] = [];
    }
    acc[item.pageNumber].push(item);
    return acc;
  }, {});
}

interface PDFViewerProps {
  fileUrl: string | null;
  highlights?: unknown;
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

function decodePdfDataUrl(dataUrl: string): Uint8Array | null {
  try {
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return null;
    const base64 = dataUrl.slice(commaIndex + 1);
    const binary = atob(base64);
    const length = binary.length;
    const buffer = new Uint8Array(length);
    for (let index = 0; index < length; index += 1) {
      buffer[index] = binary.charCodeAt(index);
    }
    return buffer;
  } catch (error) {
    console.warn("Failed to decode PDF data URL", error);
    return null;
  }
}

function PDFViewer({ fileUrl, highlights }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageMetrics, setPageMetrics] = useState<Record<number, PageMetrics>>({});
  const normalizedHighlights = useMemo(
    () => normalizeHighlights(highlights),
    [highlights]
  );
  const highlightsByPage = useMemo(
    () => groupByPage(normalizedHighlights),
    [normalizedHighlights]
  );

  const fileSource = useMemo(() => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("data:application/pdf")) {
      const decoded = decodePdfDataUrl(fileUrl);
      if (decoded) {
        return { data: decoded };
      }
    }
    return fileUrl;
  }, [fileUrl]);

  const containerWidth = useContainerWidth(containerRef);
  const computedWidth = containerWidth > 0 ? containerWidth - 16 : 640;
  const pageWidth = Math.max(Math.min(computedWidth, 900), 280);

  const handleDocumentLoad = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
  };

  const handlePageRender = (pageNumber: number) => (page: {
    getViewport: (options: { scale: number }) => { width: number; height: number };
  }) => {
    const viewport = page.getViewport({ scale: 1 });
    const width = pageWidth > 0 ? pageWidth : viewport.width;
    const scale = width / viewport.width;
    setPageMetrics((prev) => ({
      ...prev,
      [pageNumber]: {
        originalWidth: viewport.width,
        originalHeight: viewport.height,
        renderedWidth: width,
        renderedHeight: viewport.height * scale,
      },
    }));
  };

  if (!fileSource) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No PDF preview available for this document session.
          </p>
          <p className="text-xs text-muted-foreground">
            Try uploading the document again to restore the preview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col items-center gap-4 overflow-auto"
    >
      <Document
        key={typeof fileSource === "string" ? fileSource : "embedded"}
        file={fileSource}
        onLoadSuccess={handleDocumentLoad}
        loading={
          <div className="flex h-[420px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
        error={
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center">
            <AlertTriangle className="size-6 text-amber-500" />
            <p className="text-sm font-medium">Unable to load PDF preview</p>
            <p className="text-xs text-muted-foreground">
              Please try uploading the document again.
            </p>
          </div>
        }
        noData={
          <div className="flex h-[420px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No PDF data found.</p>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1;
          const pageHighlight = highlightsByPage[pageNumber] ?? [];
          const metrics = pageMetrics[pageNumber];
          const renderedHighlights = metrics
            ? pageHighlight.map((item) => {
                const scaleX = metrics.renderedWidth / metrics.originalWidth;
                const scaleY = metrics.renderedHeight / metrics.originalHeight;

                return {
                  id: item.id,
                  left: item.x * scaleX,
                  top: item.y * scaleY,
                  width: item.width * scaleX,
                  height: item.height * scaleY,
                };
              })
            : [];

          return (
            <div key={pageNumber} className="relative w-full">
              <Page
                pageNumber={pageNumber}
                width={pageWidth > 0 ? pageWidth : undefined}
                onRenderSuccess={handlePageRender(pageNumber)}
                className="!mx-auto !mt-4 !mb-2"
              />
              {metrics && renderedHighlights.length > 0 && (
                <HighlightOverlay boxes={renderedHighlights} />
              )}
            </div>
          );
        })}
      </Document>
    </div>
  );
}

export default memo(PDFViewer);
