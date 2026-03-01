"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import type { ProgramBookSection } from "@/types/localStorage/stage";
import { sectionTypeBadgeClass, sectionTypeLabel } from "./types";
import { SectionTypeIcon } from "./section-type-icon";

export interface SectionRowProps {
  section: ProgramBookSection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SectionRow = memo(function SectionRow({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: SectionRowProps) {
  return (
    <div
      className="flex items-start gap-2 py-2.5 border-b last:border-b-0"
      role="listitem"
    >
      {/* 순서 번호 */}
      <span
        className="text-[10px] text-muted-foreground w-4 text-right flex-shrink-0 pt-0.5"
        aria-label={`순서 ${section.order}`}
      >
        {section.order}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full border ${sectionTypeBadgeClass(section.type)}`}
            aria-label={`유형: ${sectionTypeLabel(section.type)}`}
          >
            <SectionTypeIcon type={section.type} className="h-2.5 w-2.5" />
            {sectionTypeLabel(section.type)}
          </span>
          <span className="text-xs font-semibold truncate">{section.title}</span>
        </div>
        {section.content && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {section.content}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div
        className="flex items-center gap-0.5 flex-shrink-0"
        role="group"
        aria-label={`${section.title} 섹션 액션`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="위로 이동"
          title="위로"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onMoveUp();
            }
          }}
        >
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="아래로 이동"
          title="아래로"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onMoveDown();
            }
          }}
        >
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
          onClick={onEdit}
          aria-label={`${section.title} 편집`}
          title="편집"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onEdit();
            }
          }}
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`${section.title} 삭제`}
          title="삭제"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onDelete();
            }
          }}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
