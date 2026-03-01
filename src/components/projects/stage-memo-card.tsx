"use client";

// ============================================================
// 무대 메모 카드 — 메인 컨테이너
// ============================================================

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageMemo } from "@/hooks/use-stage-memo";
import type { StageMemoNote, StageMemoZone } from "@/types";
import { CreateBoardDialog, AddNoteDialog } from "./stage-memo-dialogs";
import { BoardListItem } from "./stage-memo-board-list-item";
import { BoardDetailView } from "./stage-memo-board-detail";

// ============================================================
// Props
// ============================================================

interface StageMemoCardProps {
  groupId: string;
  projectId: string;
}

// ============================================================
// 메인 카드
// ============================================================

export function StageMemoCard({ groupId, projectId }: StageMemoCardProps) {
  const [cardOpen, setCardOpen] = useState(true);
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [addNoteDefaultZone, setAddNoteDefaultZone] = useState<
    StageMemoZone | undefined
  >(undefined);

  const {
    boards,
    loading,
    addBoard,
    deleteBoard,
    addNote,
    deleteNote,
    toggleResolved,
    getNotesByZone,
    stats,
  } = useStageMemo(groupId, projectId);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;
  const notesByZone = selectedBoardId
    ? getNotesByZone(selectedBoardId)
    : ({} as Record<StageMemoZone, StageMemoNote[]>);

  function handleDeleteBoard(boardId: string) {
    deleteBoard(boardId);
    if (selectedBoardId === boardId) setSelectedBoardId(null);
    toast.success(TOAST.STAGE_MEMO.BOARD_DELETED);
  }

  function handleAddNoteClick(zone?: StageMemoZone) {
    setAddNoteDefaultZone(zone);
    setShowAddNoteDialog(true);
  }

  function handleOpenCreateBoard() {
    setShowCreateBoardDialog(true);
    if (!cardOpen) setCardOpen(true);
  }

  return (
    <>
      <Card className="shadow-sm">
        <Collapsible
          open={cardOpen}
          onOpenChange={setCardOpen}
        >
          <CardHeader className="py-2 px-4">
            <CollapsibleTrigger asChild>
              <div
                className="flex items-center justify-between cursor-pointer"
                role="button"
                aria-expanded={cardOpen}
                aria-controls="stage-memo-content"
              >
                <div className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4 text-rose-500"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-semibold">
                    공연 무대 메모
                  </CardTitle>

                  {/* 전체 통계 배지 */}
                  {stats.totalNotes > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700"
                      aria-label={`전체 메모 ${stats.totalNotes}개`}
                    >
                      {stats.totalNotes}개
                    </Badge>
                  )}
                  {stats.unresolvedNotes > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700"
                      aria-label={`미해결 메모 ${stats.unresolvedNotes}개`}
                    >
                      미해결 {stats.unresolvedNotes}
                    </Badge>
                  )}
                  {stats.highPriorityNotes > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 gap-0.5"
                      aria-label={`고우선순위 미해결 ${stats.highPriorityNotes}개`}
                    >
                      <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                      {stats.highPriorityNotes}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCreateBoard();
                    }}
                    aria-label="새 보드 만들기"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  {cardOpen ? (
                    <ChevronUp
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent id="stage-memo-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <div className="text-center py-4" role="status" aria-live="polite">
                  <p className="text-xs text-muted-foreground">불러오는 중...</p>
                </div>
              ) : selectedBoard ? (
                /* 보드 상세 뷰 */
                <BoardDetailView
                  board={selectedBoard}
                  notesByZone={notesByZone}
                  onBack={() => setSelectedBoardId(null)}
                  onAddNote={handleAddNoteClick}
                  onToggleResolved={(noteId) => {
                    toggleResolved(selectedBoard.id, noteId);
                  }}
                  onDeleteNote={(noteId) => {
                    deleteNote(selectedBoard.id, noteId);
                    toast.success(TOAST.STAGE_MEMO.MEMO_DELETED);
                  }}
                />
              ) : boards.length === 0 ? (
                /* 빈 상태 */
                <div
                  className="text-center py-6 space-y-2"
                  role="status"
                  aria-label="등록된 보드가 없습니다"
                >
                  <MapPin
                    className="h-8 w-8 text-muted-foreground/40 mx-auto"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    아직 무대 메모 보드가 없습니다.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowCreateBoardDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    첫 번째 보드 만들기
                  </Button>
                </div>
              ) : (
                /* 보드 목록 */
                <div className="space-y-2">
                  <ul role="list" aria-label="무대 메모 보드 목록" className="space-y-2">
                    {boards.map((board) => (
                      <li key={board.id} role="listitem">
                        <BoardListItem
                          board={board}
                          onOpen={() => setSelectedBoardId(board.id)}
                          onDelete={() => handleDeleteBoard(board.id)}
                        />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="w-full border border-dashed border-border/50 rounded-lg py-3 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-rose-500 hover:border-rose-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    onClick={() => setShowCreateBoardDialog(true)}
                    aria-label="새 보드 추가"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs">새 보드 추가</span>
                  </button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 보드 생성 다이얼로그 */}
      <CreateBoardDialog
        open={showCreateBoardDialog}
        onClose={() => setShowCreateBoardDialog(false)}
        onSubmit={(title) => {
          const board = addBoard(title);
          toast.success(TOAST.STAGE_MEMO.BOARD_CREATED);
          setSelectedBoardId(board.id);
        }}
      />

      {/* 메모 추가 다이얼로그 */}
      <AddNoteDialog
        open={showAddNoteDialog}
        onClose={() => setShowAddNoteDialog(false)}
        defaultZone={addNoteDefaultZone}
        onSubmit={(zone, priority, content, author, tags) => {
          if (!selectedBoardId) return;
          addNote(selectedBoardId, { zone, priority, content, author, tags });
          toast.success(TOAST.STAGE_MEMO.MEMO_ADDED);
        }}
      />
    </>
  );
}
