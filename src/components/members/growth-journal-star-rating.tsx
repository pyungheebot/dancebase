"use client";

// ============================================
// 별점 컴포넌트 (1~5점)
// ============================================

import { memo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  /** readonly=true 이면 클릭 및 호버 비활성화 */
  readonly?: boolean;
}

export const StarRating = memo(function StarRating({
  value,
  onChange,
  readonly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="flex gap-0.5"
      role="group"
      aria-label={`자기평가 ${value}점`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          aria-label={`${n}점`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              (hovered ? n <= hovered : n <= value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
});
