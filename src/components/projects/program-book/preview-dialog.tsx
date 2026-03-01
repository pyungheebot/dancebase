"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import type { ProgramBookSection } from "@/types/localStorage/stage";
import { formatShowDate, sectionTypeBadgeClass, sectionTypeLabel } from "./types";
import { SectionTypeIcon } from "./section-type-icon";

export interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTitle: string;
  showDate: string;
  venue: string;
  sections: ProgramBookSection[];
}

export function PreviewDialog({
  open,
  onOpenChange,
  showTitle,
  showDate,
  venue,
  sections,
}: PreviewDialogProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby="preview-desc"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              프로그램북 미리보기
            </DialogTitle>
          </div>
        </DialogHeader>
        <p id="preview-desc" className="sr-only">
          공연 프로그램북의 전체 내용을 미리 확인합니다.
        </p>

        {/* 표지 영역 */}
        <div
          className="border rounded-lg bg-gradient-to-b from-muted/60 to-muted/20 p-6 text-center space-y-1.5"
          role="region"
          aria-label="프로그램북 표지"
        >
          <h2 className="text-base font-bold leading-tight">{showTitle}</h2>
          {showDate && (
            <p className="text-xs text-muted-foreground">
              <time dateTime={showDate}>{formatShowDate(showDate)}</time>
            </p>
          )}
          {venue && (
            <p className="text-xs text-muted-foreground">{venue}</p>
          )}
        </div>

        {/* 섹션 목록 */}
        {sorted.length === 0 ? (
          <p
            className="text-center text-xs text-muted-foreground py-6"
            role="alert"
            aria-live="polite"
          >
            등록된 섹션이 없습니다.
          </p>
        ) : (
          <ol
            className="space-y-4"
            role="list"
            aria-label="프로그램북 섹션 목록"
          >
            {sorted.map((section) => (
              <li key={section.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full border ${sectionTypeBadgeClass(section.type)}`}
                    aria-label={`유형: ${sectionTypeLabel(section.type)}`}
                  >
                    <SectionTypeIcon type={section.type} className="h-2.5 w-2.5" />
                    {sectionTypeLabel(section.type)}
                  </span>
                  <span className="text-xs font-semibold">{section.title}</span>
                </div>
                {section.content && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
