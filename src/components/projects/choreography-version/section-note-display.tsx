"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import type { ChoreoSectionNote } from "@/types";

// ============================================
// 섹션 노트 표시 행 (읽기 전용)
// ============================================

export interface SectionNoteDisplayProps {
  section: ChoreoSectionNote;
  highlight?: boolean;
}

export const SectionNoteDisplay = memo(function SectionNoteDisplay({
  section,
  highlight,
}: SectionNoteDisplayProps) {
  return (
    <div
      role="listitem"
      className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 ${
        highlight
          ? "bg-amber-50 border border-amber-200"
          : "bg-muted/20"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground">
            {section.sectionName}
          </span>
          {section.changed && (
            <Badge
              className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 shrink-0"
              aria-label="변경된 구간"
            >
              변경
            </Badge>
          )}
        </div>
        {section.content && (
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-wrap">
            {section.content}
          </p>
        )}
      </div>
    </div>
  );
});
