"use client";

// ============================================================
// 무대 메모 카드 — 보드 상세 뷰
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, MapPin, Plus } from "lucide-react";
import type { StageMemoBoard, StageMemoNote, StageMemoZone } from "@/types";
import { ZONE_LABELS, FILTER_LABELS, type NoteFilter } from "./stage-memo-types";
import { StageGrid } from "./stage-memo-grid";
import { NoteItem } from "./stage-memo-note-item";

interface BoardDetailViewProps {
  board: StageMemoBoard;
  notesByZone: Record<StageMemoZone, StageMemoNote[]>;
  onBack: () => void;
  onAddNote: (zone?: StageMemoZone) => void;
  onToggleResolved: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function BoardDetailView({
  board,
  notesByZone,
  onBack,
  onAddNote,
  onToggleResolved,
  onDeleteNote,
}: BoardDetailViewProps) {
  const [selectedZone, setSelectedZone] = useState<StageMemoZone | null>(null);
  const [noteFilter, setNoteFilter] = useState<NoteFilter>("all");

  // 선택 구역의 메모 (필터 + 정렬 적용)
  const zonalNotes = selectedZone ? (notesByZone[selectedZone] ?? []) : [];
  const filteredNotes = zonalNotes
    .filter((n) => {
      if (noteFilter === "unresolved") return !n.isResolved;
      if (noteFilter === "high") return n.priority === "high";
      return true;
    })
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // 전체 통계
  const allNotes = board.notes;
  const unresolvedCount = allNotes.filter((n) => !n.isResolved).length;
  const highCount = allNotes.filter(
    (n) => n.priority === "high" && !n.isResolved
  ).length;

  function handleZoneClick(zone: StageMemoZone) {
    setSelectedZone((prev) => (prev === zone ? null : zone));
    setNoteFilter("all");
  }

  const selectedZoneLabel = selectedZone ? ZONE_LABELS[selectedZone] : null;

  return (
    <section className="space-y-3" aria-label={`${board.title} 보드 상세`}>
      {/* 헤더 */}
      <header className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={onBack}
          aria-label="보드 목록으로 돌아가기"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          목록
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold truncate">{board.title}</h3>
        </div>
        <div
          className="flex items-center gap-1 shrink-0"
          role="group"
          aria-label="보드 통계"
        >
          {highCount > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 gap-0.5"
              aria-label={`고우선순위 미해결 ${highCount}개`}
            >
              <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
              {highCount}
            </Badge>
          )}
          {unresolvedCount > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700"
              aria-label={`미해결 메모 ${unresolvedCount}개`}
            >
              미해결 {unresolvedCount}
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => onAddNote(selectedZone ?? undefined)}
            aria-label={selectedZone ? `${selectedZoneLabel} 구역에 메모 추가` : "메모 추가"}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            메모
          </Button>
        </div>
      </header>

      {/* 무대 그리드 */}
      <StageGrid
        notesByZone={notesByZone}
        selectedZone={selectedZone}
        onZoneClick={handleZoneClick}
      />

      {/* 선택된 구역 메모 목록 */}
      {selectedZone ? (
        <section
          className="space-y-2 pt-1"
          aria-label={`${selectedZoneLabel} 구역 메모`}
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3 text-rose-500" aria-hidden="true" />
              {selectedZoneLabel} 메모
              <span className="text-muted-foreground font-normal ml-1">
                ({zonalNotes.length}개)
              </span>
            </h4>

            {/* 필터 버튼 그룹 */}
            <div
              role="group"
              aria-label="메모 필터"
              className="flex gap-1"
            >
              {(Object.keys(FILTER_LABELS) as NoteFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setNoteFilter(f)}
                  aria-pressed={noteFilter === f}
                  className={[
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    noteFilter === f
                      ? "bg-rose-500 text-white border-rose-500"
                      : "border-border/50 text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div
              className="text-center py-4 space-y-2"
              role="status"
              aria-live="polite"
            >
              <MapPin className="h-6 w-6 text-muted-foreground/40 mx-auto" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">
                {noteFilter === "all"
                  ? "이 구역에 메모가 없습니다."
                  : `${FILTER_LABELS[noteFilter]} 메모가 없습니다.`}
              </p>
              {noteFilter === "all" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAddNote(selectedZone)}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  첫 번째 메모 추가
                </Button>
              )}
            </div>
          ) : (
            <ul
              role="list"
              aria-label={`${selectedZoneLabel} 메모 목록`}
              className="space-y-1.5"
            >
              {filteredNotes.map((note) => (
                <li key={note.id} role="listitem">
                  <NoteItem
                    note={note}
                    onToggleResolved={() => onToggleResolved(note.id)}
                    onDelete={() => onDeleteNote(note.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p
          className="text-xs text-muted-foreground text-center py-2"
          aria-live="polite"
        >
          구역을 클릭하여 메모를 확인하거나 추가하세요.
        </p>
      )}
    </section>
  );
}
