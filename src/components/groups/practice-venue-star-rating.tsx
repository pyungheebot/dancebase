"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// ─── 별점 표시 ────────────────────────────────────────────────

export function StarDisplay({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const iconCls = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const colorCls =
    value <= 2
      ? "text-red-400 fill-red-400"
      : value <= 3
      ? "text-yellow-400 fill-yellow-400"
      : "text-green-500 fill-green-500";

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`별점 ${value}점`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${iconCls} transition-colors ${
            n <= Math.round(value) ? colorCls : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── 별점 입력 ────────────────────────────────────────────────

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const colorCls =
    active <= 2
      ? "text-red-400 fill-red-400"
      : active <= 3
      ? "text-yellow-400 fill-yellow-400"
      : "text-green-500 fill-green-500";

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="별점 선택"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          aria-pressed={n === value}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <Star
            aria-hidden="true"
            className={`h-5 w-5 transition-colors ${
              n <= active ? colorCls : "text-gray-300 fill-gray-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-gray-500" aria-live="polite">
          {value}점
        </span>
      )}
    </div>
  );
}
