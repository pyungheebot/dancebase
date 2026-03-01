"use client";

import { GENRE_COLORS } from "./types";

interface GenreBadgeProps {
  genre: string;
}

export function GenreBadge({ genre }: GenreBadgeProps) {
  const className =
    GENRE_COLORS[genre] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${className}`}
      aria-label={`장르: ${genre}`}
    >
      {genre}
    </span>
  );
}
