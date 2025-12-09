"use client";

import { useMemo } from "react";

interface TextPanelProps {
  text?: string | null;
}

export default function TextPanel({ text }: TextPanelProps) {
  const paragraphs = useMemo(() => {
    if (!text) return [] as string[];
    return text
      .split(/\n{2,}/)
      .map((segment) => segment.trim())
      .filter(Boolean);
  }, [text]);

  if (!text) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-muted-foreground">
        No extracted text available for this document yet.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-auto px-5 py-4 text-sm leading-relaxed">
        {paragraphs.length > 0
          ? paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 10)}`} className="whitespace-pre-line text-left">
                {paragraph}
              </p>
            ))
          : (
              <p className="whitespace-pre-line text-left">{text}</p>
            )}
      </div>
    </div>
  );
}
