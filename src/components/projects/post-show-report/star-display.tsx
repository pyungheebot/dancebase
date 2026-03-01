"use client";

import { Star } from "lucide-react";

/**
 * 별점 아이콘 표시 컴포넌트
 *
 * @example
 * <StarDisplay value={3.7} aria-label="3.7점" />
 */
export function StarDisplay({
  value,
  "aria-label": ariaLabel,
}: {
  value: number;
  "aria-label"?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={ariaLabel ?? `${value}점`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${
            n <= rounded
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
