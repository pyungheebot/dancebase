"use client";

/**
 * 별점 컴포넌트
 *
 * 읽기 전용(readonly)과 편집 가능(onChange 제공) 두 모드를 지원합니다.
 */

import { Star } from "lucide-react";

interface StarRatingProps {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
}: StarRatingProps) {
  return (
    <div className="flex gap-0.5" role="group" aria-label={`별점 ${value ?? 0}점`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`${star}점`}
          aria-pressed={value !== undefined && star <= value}
          className={readonly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              value && star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
