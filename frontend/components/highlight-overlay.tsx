"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

export type HighlightBox = {
	id: string;
	top: number;
	left: number;
	width: number;
	height: number;
};

interface HighlightOverlayProps {
	boxes: HighlightBox[];
	activeId?: string | null;
}

function HighlightOverlay({ boxes, activeId }: HighlightOverlayProps) {
	if (!boxes.length) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-10">
			{boxes.map((box) => (
				<div
					key={box.id}
					className={cn(
						"absolute rounded-sm bg-yellow-300/40 ring-1 ring-yellow-500/60 transition-opacity",
						activeId === box.id ? "opacity-90" : "opacity-60"
					)}
					style={{
						top: `${box.top}px`,
						left: `${box.left}px`,
						width: `${box.width}px`,
						height: `${box.height}px`,
					}}
				/>
			))}
		</div>
	);
}

export default memo(HighlightOverlay);
