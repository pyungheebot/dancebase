"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange: (v: number) => void;
};

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div
      className="flex gap-0.5"
      role="radiogroup"
      aria-label="멘티 만족도 별점"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n <= value}
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange(n);
            }
          }}
          className="p-0.5"
        >
          <Star
            className={cn(
              "h-4 w-4",
              n <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
            aria-hidden="true"
          />
          <span className="sr-only">{n}점{n <= value ? " (선택됨)" : ""}</span>
        </button>
      ))}
    </div>
  );
}
