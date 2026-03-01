"use client";

// ============================================================
// 무대 동선 노트 카드 - 메인 컴포넌트
// ============================================================

import { useState } from "react";
import { Footprints, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStageBlocking } from "@/hooks/use-stage-blocking";
import { StageBlockingFormDialog } from "./stage-blocking-form-dialog";
import { BlockingNoteRow } from "./stage-blocking-note-row";
import { SongGroupSection } from "./stage-blocking-song-group";
import { POSITION_CONFIG, LEGEND_POSITIONS } from "./stage-blocking-types";
import type { StageBlockingNote } from "@/types";
import type { AddStageBlockingInput } from "@/hooks/use-stage-blocking";

// ── 보기 모드 타입 ──
type ViewMode = "all" | "song";

type StageBlockingCardProps = {
  groupId: string;
  projectId: string;
};

/**
 * 무대 동선 노트 카드 컴포넌트입니다.
 * - 전체/곡별 두 가지 보기 모드를 지원합니다.
 * - 동선 노트 추가, 수정, 삭제, 순서 변경이 가능합니다.
 * - 하단에 무대 위치 범례를 표시합니다.
 */
export function StageBlockingCard({ groupId, projectId }: StageBlockingCardProps) {
  const {
    notes,
    songList,
    loading,
    addNote,
    updateNote,
    deleteNote,
    moveUp,
    moveDown,
    getBySong,
    stats,
  } = useStageBlocking(groupId, projectId);

  // 추가 다이얼로그 열림 상태
  const [addOpen, setAddOpen] = useState(false);
  // 수정 대상 노트 (null이면 수정 다이얼로그 닫힘)
  const [editTarget, setEditTarget] = useState<StageBlockingNote | null>(null);
  // 현재 보기 모드
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // 전체 멤버 이름 목록 (색상 할당용, 중복 제거)
  const allMemberNames = Array.from(
    new Set(notes.flatMap((n) => n.memberMoves.map((m) => m.memberName)))
  );

  // 수정 시작: 수정 대상 설정
  function handleEdit(note: StageBlockingNote) {
    setEditTarget(note);
  }

  // 수정 제출 처리
  async function handleUpdate(input: AddStageBlockingInput): Promise<boolean> {
    if (!editTarget) return false;
    const ok = await updateNote(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  // 삭제 처리
  async function handleDelete(id: string) {
    await deleteNote(id);
  }

  // 로딩 상태
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          {/* ── 헤더: 제목 + 보기 모드 토글 + 추가 버튼 ── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-sm font-semibold">
                무대 동선 노트
              </CardTitle>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
                aria-label={`총 ${stats.total}개 동선 노트`}
              >
                {stats.total}개
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              {/* 보기 모드 토글 버튼 */}
              <div
                className="flex rounded-md border overflow-hidden text-[10px]"
                role="group"
                aria-label="보기 모드 선택"
              >
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-2 py-1 transition-colors ${
                    viewMode === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                  aria-pressed={viewMode === "all"}
                >
                  전체
                </button>
                <button
                  onClick={() => setViewMode("song")}
                  className={`px-2 py-1 transition-colors ${
                    viewMode === "song"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                  aria-pressed={viewMode === "song"}
                >
                  곡별
                </button>
              </div>

              {/* 동선 추가 버튼 */}
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
                aria-label="새 동선 노트 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                동선 추가
              </Button>
            </div>
          </div>

          {/* ── 통계 요약 (노트가 있을 때만 표시) ── */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2" aria-label="동선 통계">
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                {stats.songCount}개 곡
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                멤버 동선 {stats.totalMemberMoves}건
              </span>
              {stats.withCaution > 0 && (
                <span className="text-[10px] text-yellow-600 bg-yellow-50 rounded px-2 py-0.5">
                  주의사항 {stats.withCaution}건
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* ── 빈 상태 안내 ── */}
          {notes.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Footprints
                className="h-8 w-8 mx-auto text-muted-foreground/40"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                등록된 동선 노트가 없습니다
              </p>
              <p className="text-xs text-muted-foreground/70">
                곡/장면별 무대 동선을 기록해보세요
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                첫 번째 동선 추가
              </Button>
            </div>
          )}

          {/* ── 전체 목록 보기 ── */}
          {viewMode === "all" && notes.length > 0 && (
            <div
              className="space-y-1.5"
              role="list"
              aria-label="전체 동선 노트 목록"
            >
              {notes.map((note, idx) => (
                <BlockingNoteRow
                  key={note.id}
                  note={note}
                  allMemberNames={allMemberNames}
                  isFirst={idx === 0}
                  isLast={idx === notes.length - 1}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </div>
          )}

          {/* ── 곡별 목록 보기 ── */}
          {viewMode === "song" && notes.length > 0 && (
            <div className="space-y-4" aria-label="곡별 동선 노트 목록">
              {songList.map((song) => (
                <SongGroupSection
                  key={song}
                  songTitle={song}
                  notes={getBySong(song)}
                  allNotes={notes}
                  allMemberNames={allMemberNames}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </div>
          )}

          {/* ── 무대 위치 범례 ── */}
          {notes.length > 0 && (
            <div className="pt-2 border-t space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                무대 위치 범례
              </span>
              <div
                className="flex flex-wrap gap-1.5"
                role="list"
                aria-label="무대 위치 범례"
              >
                {LEGEND_POSITIONS.map((pos) => (
                  <span
                    key={pos}
                    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[9px] ${POSITION_CONFIG[pos].color}`}
                    role="listitem"
                    aria-label={`${POSITION_CONFIG[pos].short}: ${POSITION_CONFIG[pos].label}`}
                  >
                    <span className="font-bold">{POSITION_CONFIG[pos].short}</span>
                    <span>{POSITION_CONFIG[pos].label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 동선 추가 다이얼로그 ── */}
      <StageBlockingFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addNote}
        title="동선 노트 추가"
      />

      {/* ── 동선 수정 다이얼로그 (수정 대상이 있을 때만 마운트) ── */}
      {editTarget && (
        <StageBlockingFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSubmit={handleUpdate}
          title="동선 노트 수정"
        />
      )}
    </>
  );
}
