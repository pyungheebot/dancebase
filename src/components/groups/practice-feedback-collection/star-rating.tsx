"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "xs";
};

export function StarRating({ value, onChange, size = "sm" }: StarRatingProps) {
  const iconClass = size === "xs" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div
      className="flex gap-0.5"
      role="radiogroup"
      aria-label="별점 선택"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
          aria-label={`${star}점`}
          aria-pressed={star === value}
          disabled={!onChange}
        >
          <Star
            className={cn(
              iconClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40"
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
