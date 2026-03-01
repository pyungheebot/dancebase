"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
};

export function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  return (
    <div
      className="flex gap-0.5"
      role="group"
      aria-label={readonly ? `평점 ${value}점` : "별점 선택"}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          aria-label={`${n}점`}
          aria-pressed={n === value}
          className={cn(
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <Star
            className={cn(
              "h-4 w-4",
              n <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
