"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import type { ChoreoSectionNote } from "@/types";

// ============================================
// 섹션 노트 입력 행 (편집용)
// ============================================

export interface SectionNoteRowProps {
  section: Omit<ChoreoSectionNote, "changed">;
  index: number;
  onChange: (patch: Partial<Omit<ChoreoSectionNote, "changed">>) => void;
  onDelete: () => void;
}

export const SectionNoteRow = memo(function SectionNoteRow({
  section,
  index,
  onChange,
  onDelete,
}: SectionNoteRowProps) {
  const nameId = `section-name-${index}`;
  const contentId = `section-content-${index}`;

  return (
    <fieldset className="border rounded-md p-2.5 space-y-1.5 bg-background">
      <legend className="sr-only">구간 {index + 1}</legend>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor={nameId} className="sr-only">
            구간명 {index + 1}
          </label>
          <Input
            id={nameId}
            value={section.sectionName}
            onChange={(e) => onChange({ sectionName: e.target.value })}
            placeholder="구간명 (예: 인트로, 1절)"
            className="h-7 text-xs"
            aria-label={`구간 ${index + 1} 이름`}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onDelete}
          aria-label={`구간 ${index + 1} 삭제`}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" aria-hidden="true" />
        </Button>
      </div>
      <div>
        <label htmlFor={contentId} className="sr-only">
          구간 {index + 1} 노트 내용
        </label>
        <Textarea
          id={contentId}
          value={section.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="이 구간 안무 노트를 입력하세요"
          className="text-xs resize-none min-h-[48px]"
          aria-label={`구간 ${index + 1} 노트 내용`}
        />
      </div>
    </fieldset>
  );
});
