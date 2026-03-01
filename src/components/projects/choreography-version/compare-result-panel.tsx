"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { GitCompare } from "lucide-react";
import { SectionNoteDisplay } from "./section-note-display";
import type { ChoreoVersion, ChoreoSectionNote } from "@/types";

// ============================================
// 버전 비교 결과 패널
// ============================================

export interface CompareResultPanelProps {
  versionA: ChoreoVersion;
  versionB: ChoreoVersion;
  diffSections: ChoreoSectionNote[];
}

export const CompareResultPanel = memo(function CompareResultPanel({
  versionA,
  versionB,
  diffSections,
}: CompareResultPanelProps) {
  const changedCount = diffSections.filter((s) => s.changed).length;

  return (
    <section
      aria-label={`v${versionA.versionNumber} vs v${versionB.versionNumber} 비교 결과`}
      aria-live="polite"
      className="border rounded-md p-3 bg-blue-50/50 space-y-2"
    >
      <div className="flex items-center gap-2">
        <GitCompare className="h-3.5 w-3.5 text-blue-600 shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium">
          v{versionA.versionNumber} ({versionA.label}) vs v{versionB.versionNumber} ({versionB.label})
        </span>
        {changedCount > 0 ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            {changedCount}개 변경
          </Badge>
        ) : (
          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            변경 없음
          </Badge>
        )}
      </div>

      {diffSections.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          비교할 구간 노트가 없습니다.
        </p>
      ) : (
        <div role="list" aria-label="구간별 변경 내역">
          {diffSections.map((sec, idx) => (
            <SectionNoteDisplay
              key={idx}
              section={sec}
              highlight={sec.changed}
            />
          ))}
        </div>
      )}
    </section>
  );
});
