"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// ============================================================
// 별점 컴포넌트
// ============================================================

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div
      className="flex items-center gap-0.5"
      role="radiogroup"
      aria-label={readOnly ? `별점 ${value}점` : "별점 선택"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = readOnly ? n <= value : n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            onKeyDown={(e) => {
              if (!readOnly && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onChange?.(n);
              }
            }}
            aria-label={`${n}점`}
            aria-pressed={value === n}
            className={`p-0 leading-none transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          >
            <Star
              className={`${iconClass} transition-colors ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
              aria-hidden="true"
            />
            <span className="sr-only">{n}점{value === n ? " (선택됨)" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
