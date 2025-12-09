import Link from "next/link";

import { Button } from "@/components/button";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted to-background px-6 py-24 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
        <span className="rounded-full border bg-background/60 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Document extractor
        </span>
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          Transform PDFs into structured insights with instant highlights
        </h1>
        <p className="text-pretty text-base text-muted-foreground sm:text-lg">
          Upload a PDF to analyse its content, review the extracted text, and
          inspect the highlights aligned with the original document side by side.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/upload">Get started</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/viewer">Open last document</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
