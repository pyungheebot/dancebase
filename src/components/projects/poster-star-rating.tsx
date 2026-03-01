"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// ============================================================
// 별점 컴포넌트
// ============================================================

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "xs";
  /** 접근성용 레이블 (기본: "별점") */
  label?: string;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "sm",
  label = "별점",
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const iconClass = size === "xs" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div
      className="flex items-center gap-0.5"
      role={readonly ? "img" : "group"}
      aria-label={readonly ? `${label}: ${value}점` : `${label} 선택`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <Star
            key={n}
            className={`${iconClass} transition-colors ${
              filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${readonly ? "cursor-default" : "cursor-pointer"}`}
            aria-hidden={readonly ? "true" : undefined}
            role={readonly ? undefined : "button"}
            aria-label={readonly ? undefined : `${n}점`}
            tabIndex={readonly ? undefined : 0}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange?.(n)}
            onKeyDown={(e) => {
              if (!readonly && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onChange?.(n);
              }
            }}
          />
        );
      })}
    </div>
  );
}
