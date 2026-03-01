"use client";

// ============================================================
// 곡별 그룹 섹션 - 같은 곡 제목의 동선 노트를 묶어 표시
// ============================================================

import { memo, useState } from "react";
import { Music, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlockingNoteRow } from "./stage-blocking-note-row";
import type { StageBlockingNote } from "@/types";

type SongGroupSectionProps = {
  songTitle: string;
  /** 해당 곡에 속하는 노트 목록 */
  notes: StageBlockingNote[];
  /** 전체 노트 목록 (순서 이동의 전역 인덱스 계산용) */
  allNotes: StageBlockingNote[];
  allMemberNames: string[];
  onEdit: (note: StageBlockingNote) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

/**
 * 동일 곡 제목으로 묶인 동선 노트들을 접을 수 있는 섹션으로 표시합니다.
 * - 헤더: 곡 제목, 노트 수
 * - 내용: BlockingNoteRow 목록
 * React.memo 적용으로 다른 곡 섹션 변경 시 불필요한 리렌더링을 방지합니다.
 */
export const SongGroupSection = memo(function SongGroupSection({
  songTitle,
  notes,
  allNotes,
  allMemberNames,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SongGroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-1.5">
      {/* 섹션 헤더 (토글 버튼) */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 w-full group"
        aria-expanded={!collapsed}
        aria-controls={`song-group-${songTitle}`}
        aria-label={`${songTitle} 섹션 ${collapsed ? "펼치기" : "접기"}`}
      >
        <Music className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-semibold">{songTitle}</span>
        <Badge variant="secondary" className="text-[9px] px-1 py-0">
          {notes.length}개
        </Badge>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ml-auto ${
            collapsed ? "-rotate-90" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* 노트 목록 (접히면 숨김) */}
      {!collapsed && (
        <div
          id={`song-group-${songTitle}`}
          className="space-y-1.5 pl-1"
          role="list"
          aria-label={`${songTitle} 동선 노트 목록`}
        >
          {notes.map((note) => {
            // 전체 목록 기준으로 첫/마지막 여부 계산 (순서 이동 버튼 표시 제어)
            const globalIdx = allNotes.findIndex((n) => n.id === note.id);
            return (
              <BlockingNoteRow
                key={note.id}
                note={note}
                allMemberNames={allMemberNames}
                isFirst={globalIdx === 0}
                isLast={globalIdx === allNotes.length - 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
