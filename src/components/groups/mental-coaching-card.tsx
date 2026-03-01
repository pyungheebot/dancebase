"use client";

import { useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Plus,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMentalCoaching } from "@/hooks/use-mental-coaching";
import type {
  MentalCoachingNote,
  MentalCoachingStatus,
  MentalCoachingActionItem,
} from "@/types";

import { NoteDialog } from "./mental-coaching/note-dialog";
import { NoteCard } from "./mental-coaching/note-card";
import { StatsPanel } from "./mental-coaching/stats-panel";
import { TOPICS, STATUS_LABEL, type FilterTopic, type FilterStatus } from "./mental-coaching/types";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MentalCoachingCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    notes,
    loading,
    stats,
    addNote,
    updateNote,
    deleteNote,
    toggleActionItem,
    updateStatus,
  } = useMentalCoaching(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MentalCoachingNote | null>(null);
  const [filterTopic, setFilterTopic] = useState<FilterTopic>("전체");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");
  const [showStats, setShowStats] = useState(false);

  const filtered = notes.filter((n) => {
    if (filterTopic !== "전체" && n.topic !== filterTopic) return false;
    if (filterStatus !== "전체" && n.status !== filterStatus) return false;
    return true;
  });

  const sortedFiltered = filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd(data: Parameters<typeof addNote>[0]) {
    addNote(data);
    toast.success(TOAST.COACHING_NOTE.ADDED);
  }

  function handleEdit(data: Parameters<typeof addNote>[0]) {
    if (!editTarget) return;
    const actionItemsWithId: MentalCoachingActionItem[] = data.actionItems.map(
      (a, i) => ({
        ...a,
        id: editTarget.actionItems[i]?.id ?? crypto.randomUUID(),
      })
    );
    const ok = updateNote(editTarget.id, {
      ...data,
      actionItems: actionItemsWithId,
    });
    if (ok) toast.success(TOAST.COACHING_NOTE.UPDATED);
    else toast.error(TOAST.UPDATE_ERROR);
    setEditTarget(null);
  }

  function handleDelete(noteId: string) {
    const ok = deleteNote(noteId);
    if (ok) toast.success(TOAST.MENTAL_COACHING.NOTE_DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleToggleAction(noteId: string, actionId: string) {
    toggleActionItem(noteId, actionId);
  }

  function handleStatusChange(noteId: string, status: MentalCoachingStatus) {
    const ok = updateStatus(noteId, status);
    if (ok) toast.success(`상태가 "${STATUS_LABEL[status]}"으로 변경되었습니다.`);
    else toast.error(TOAST.MENTAL_COACHING.STATUS_ERROR);
  }

  const statsToggleId = "mental-coaching-stats";

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 카드 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
              aria-controls="mental-coaching-content"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" aria-hidden="true" />
                <span className="text-sm font-medium">멘탈 코칭 노트</span>
                {stats.totalNotes > 0 && (
                  <Badge
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700"
                    aria-label={`총 ${stats.totalNotes}개 노트`}
                  >
                    {stats.totalNotes}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent id="mental-coaching-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 툴바 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 통계 토글 */}
                  <Button
                    variant={showStats ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setShowStats(!showStats)}
                    aria-pressed={showStats}
                    aria-controls={statsToggleId}
                    aria-expanded={showStats}
                  >
                    <BarChart2 className="h-3 w-3 mr-0.5" aria-hidden="true" />
                    통계
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddOpen(true)}
                  aria-label="코칭 노트 추가"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  노트 추가
                </Button>
              </div>

              {/* 통계 패널 */}
              <div id={statsToggleId} aria-live="polite">
                {showStats && <StatsPanel stats={stats} />}
              </div>

              {/* 필터 */}
              <div className="space-y-1.5">
                {/* 주제 필터 */}
                <div
                  className="flex gap-1 flex-wrap"
                  role="tablist"
                  aria-label="주제 필터"
                >
                  <Button
                    variant={filterTopic === "전체" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setFilterTopic("전체")}
                    role="tab"
                    aria-selected={filterTopic === "전체"}
                    aria-controls="note-list"
                  >
                    전체
                  </Button>
                  {TOPICS.map((t) => (
                    <Button
                      key={t}
                      variant={filterTopic === t ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilterTopic(t)}
                      role="tab"
                      aria-selected={filterTopic === t}
                      aria-controls="note-list"
                    >
                      {t}
                    </Button>
                  ))}
                </div>

                {/* 상태 필터 */}
                <div
                  className="flex gap-1"
                  role="tablist"
                  aria-label="상태 필터"
                >
                  {(
                    [
                      { value: "전체", label: "전체" },
                      { value: "진행중", label: "진행중" },
                      { value: "개선됨", label: "개선됨" },
                      { value: "해결됨", label: "해결됨" },
                    ] as { value: FilterStatus; label: string }[]
                  ).map((f) => (
                    <Button
                      key={f.value}
                      variant={filterStatus === f.value ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilterStatus(f.value)}
                      role="tab"
                      aria-selected={filterStatus === f.value}
                      aria-controls="note-list"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 노트 목록 */}
              {loading ? (
                <div
                  className="text-xs text-muted-foreground text-center py-4"
                  role="alert"
                  aria-live="polite"
                >
                  불러오는 중...
                </div>
              ) : sortedFiltered.length === 0 ? (
                <div
                  className="text-xs text-muted-foreground text-center py-6"
                  role="alert"
                  aria-live="polite"
                >
                  {notes.length === 0
                    ? "아직 코칭 노트가 없습니다. 첫 노트를 추가해보세요."
                    : "해당 조건의 노트가 없습니다."}
                </div>
              ) : (
                <div
                  id="note-list"
                  className="space-y-2"
                  role="list"
                  aria-label="코칭 노트 목록"
                  aria-live="polite"
                >
                  {sortedFiltered.map((note) => (
                    <div key={note.id} role="listitem">
                      <NoteCard
                        note={note}
                        onEdit={() => setEditTarget(note)}
                        onDelete={() => handleDelete(note.id)}
                        onToggleAction={(actionId) =>
                          handleToggleAction(note.id, actionId)
                        }
                        onStatusChange={(status) =>
                          handleStatusChange(note.id, status)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가 다이얼로그 */}
      <NoteDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        memberNames={memberNames}
        onSave={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <NoteDialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          memberNames={memberNames}
          initial={editTarget}
          onSave={handleEdit}
        />
      )}
    </>
  );
}
