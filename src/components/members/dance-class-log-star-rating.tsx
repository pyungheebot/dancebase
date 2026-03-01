"use client";

// ============================================================
// 댄스 수업 수강 기록 - 별점 컴포넌트
// ============================================================

import { useState } from "react";
import { Star } from "lucide-react";

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
    // 별점 컨테이너 - 접근성: radiogroup 역할 부여
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? undefined : "radiogroup"}
      aria-label={readOnly ? `별점 ${value}점` : "자가 평가 별점 선택"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = readOnly ? n <= value : n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            role={readOnly ? undefined : "radio"}
            aria-checked={readOnly ? undefined : n === value}
            aria-label={`${n}점`}
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={`p-0 leading-none transition-colors ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Star
              className={`${iconClass} transition-colors ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
