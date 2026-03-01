"use client";

// 별점 컴포넌트 - 읽기 전용 / 입력 겸용

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  /** 현재 별점 값 (1~5) */
  value: number;
  /** 별점 변경 핸들러 (readOnly일 때는 불필요) */
  onChange?: (v: number) => void;
  /** 읽기 전용 여부 (기본값 false) */
  readOnly?: boolean;
};

/**
 * 별점 표시/입력 컴포넌트
 * - readOnly=true 일 때: 클릭 불가, 시각적 표시만
 * - readOnly=false 일 때: 클릭으로 별점 선택 가능
 */
export function StarRating({
  value,
  onChange,
  readOnly = false,
}: StarRatingProps) {
  return (
    <div
      className="flex gap-0.5"
      role="group"
      aria-label={readOnly ? `평가: ${value}점` : "별점 선택"}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readOnly && onChange?.(n)}
          className={cn("p-0.5", readOnly ? "cursor-default" : "cursor-pointer")}
          disabled={readOnly}
          aria-label={`${n}점`}
          aria-pressed={n <= value}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              n <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
