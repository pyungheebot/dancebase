"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DanceProfileSkillStar } from "@/types";
import { STAR_COLORS, STAR_LABELS } from "./dance-style-profile-types";

interface StarSelectorProps {
  value: DanceProfileSkillStar;
  onChange: (v: DanceProfileSkillStar) => void;
}

export function StarSelector({ value, onChange }: StarSelectorProps) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="숙련도 선택">
      {([1, 2, 3, 4, 5] as DanceProfileSkillStar[]).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={`${n}점 - ${STAR_LABELS[n]}`}
          aria-pressed={n <= value}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              n <= value
                ? `fill-current ${STAR_COLORS[value]}`
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
      <span className="ml-1.5 text-[10px] text-muted-foreground" aria-live="polite">
        {STAR_LABELS[value]}
      </span>
    </div>
  );
}
