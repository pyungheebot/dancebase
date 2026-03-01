"use client";

import { Badge } from "@/components/ui/badge";
import type { ShowGalleryCategory } from "@/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "./types";

interface CategoryBadgeProps {
  category: ShowGalleryCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge
      className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[category]}`}
      aria-label={`카테고리: ${CATEGORY_LABELS[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}
