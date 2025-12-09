"use client";

export default function ImageViewer({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <img
        src={fileUrl}
        alt="preview"
        className="max-h-[85vh] max-w-full rounded-lg shadow"
      />
    </div>
  );
}
