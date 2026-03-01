"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupPracticeJournal } from "@/hooks/use-group-practice-journal";
import type { GroupPracticeJournalEntry } from "@/types";
import {
  type JournalFormState,
  type PracticeJournalCardProps,
  arrayToText,
  textToArray,
  formatDuration,
} from "./practice-journal/types";
import { JournalEntryItem } from "./practice-journal/journal-entry-item";
import { MonthlyStatsView } from "./practice-journal/monthly-stats-view";
import { JournalFormDialog } from "./practice-journal/journal-form-dialog";

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function PracticeJournalCard({
  groupId,
  memberNames = [],
}: PracticeJournalCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupPracticeJournalEntry | null>(
    null
  );

  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    monthStats,
    totalMinutes,
    currentMonthMinutes,
  } = useGroupPracticeJournal(groupId);

  const handleCreate = (form: JournalFormState) => {
    const ok = addEntry({
      date: form.date,
      durationMinutes: form.durationMinutes,
      participants: textToArray(form.participants),
      contentSummary: form.contentSummary.trim(),
      songs: textToArray(form.songs),
      achievedGoals: textToArray(form.achievedGoals),
      unachievedItems: textToArray(form.unachievedItems),
      nextPlanNote: form.nextPlanNote.trim(),
      authorName: form.authorName.trim(),
    });
    if (ok) {
      toast.success(TOAST.PRACTICE_JOURNAL.WRITTEN);
    } else {
      toast.error(TOAST.PRACTICE_JOURNAL.WRITE_ERROR);
    }
  };

  const handleEdit = (form: JournalFormState) => {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      date: form.date,
      durationMinutes: form.durationMinutes,
      participants: textToArray(form.participants),
      contentSummary: form.contentSummary.trim(),
      songs: textToArray(form.songs),
      achievedGoals: textToArray(form.achievedGoals),
      unachievedItems: textToArray(form.unachievedItems),
      nextPlanNote: form.nextPlanNote.trim(),
      authorName: form.authorName.trim(),
    });
    if (ok) {
      toast.success(TOAST.PRACTICE_JOURNAL.UPDATED);
    } else {
      toast.error(TOAST.PRACTICE_JOURNAL.UPDATE_ERROR);
    }
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success(TOAST.PRACTICE_JOURNAL.DELETED);
  };

  const editInitialValues: Partial<JournalFormState> | undefined = editTarget
    ? {
        date: editTarget.date,
        durationMinutes: editTarget.durationMinutes,
        participants: arrayToText(editTarget.participants),
        contentSummary: editTarget.contentSummary,
        songs: arrayToText(editTarget.songs),
        achievedGoals: arrayToText(editTarget.achievedGoals),
        unachievedItems: arrayToText(editTarget.unachievedItems),
        nextPlanNote: editTarget.nextPlanNote,
        authorName: editTarget.authorName,
      }
    : undefined;

  const headerId = "practice-journal-card-header";
  const listRegionId = "practice-journal-list";

  return (
    <>
      <div
        className="rounded-lg border bg-card p-3 space-y-2"
        role="region"
        aria-labelledby={headerId}
      >
        {/* 헤더 */}
        <button
          id={headerId}
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-controls={listRegionId}
          aria-pressed={collapsed}
        >
          <BookOpen
            className="h-3.5 w-3.5 text-orange-500 shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs font-medium flex-1">연습 일지 요약</span>

          {currentMonthMinutes > 0 && (
            <span
              className="text-[10px] text-orange-600 font-semibold shrink-0"
              aria-label={`이번 달 ${formatDuration(currentMonthMinutes)}`}
            >
              이번 달 {formatDuration(currentMonthMinutes)}
            </span>
          )}

          {entries.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0 rounded bg-orange-100 text-orange-700 font-semibold shrink-0"
              aria-label={`총 ${entries.length}건`}
            >
              {entries.length}건
            </span>
          )}

          {collapsed ? (
            <ChevronRight
              className="h-3.5 w-3.5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="h-3.5 w-3.5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          )}
        </button>

        {!collapsed && (
          <div id={listRegionId} className="space-y-2">
            {/* 요약 통계 */}
            {entries.length > 0 && (
              <dl
                className="bg-orange-50 dark:bg-orange-950/30 rounded-md px-2.5 py-2 flex items-center gap-3"
                aria-label="연습 통계 요약"
              >
                <div className="flex items-center gap-1.5">
                  <Clock
                    className="h-3.5 w-3.5 text-orange-500"
                    aria-hidden="true"
                  />
                  <div>
                    <dd className="text-xs font-bold text-orange-700">
                      {formatDuration(totalMinutes)}
                    </dd>
                    <dt className="text-[9px] text-muted-foreground">총 연습</dt>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <BookOpen
                    className="h-3.5 w-3.5 text-amber-500"
                    aria-hidden="true"
                  />
                  <div>
                    <dd className="text-xs font-bold text-amber-700">
                      {entries.length}
                    </dd>
                    <dt className="text-[9px] text-muted-foreground">총 일지</dt>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <Clock
                    className="h-3.5 w-3.5 text-blue-500"
                    aria-hidden="true"
                  />
                  <div>
                    <dd className="text-xs font-bold text-blue-700">
                      {formatDuration(currentMonthMinutes)}
                    </dd>
                    <dt className="text-[9px] text-muted-foreground">이번 달</dt>
                  </div>
                </div>
              </dl>
            )}

            {/* 월간 통계 토글 */}
            {monthStats.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowStats((p) => !p)}
                  className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  aria-expanded={showStats}
                  aria-controls="monthly-stats-panel"
                >
                  <span className="sr-only">월간 통계</span>
                  {showStats ? "통계 접기" : "월간 통계 보기"}
                  {showStats ? (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  )}
                </button>
                <div id="monthly-stats-panel" aria-live="polite">
                  {showStats && <MonthlyStatsView monthStats={monthStats} />}
                </div>
              </div>
            )}

            {/* 일지 목록 */}
            {loading ? (
              <p
                className="text-[10px] text-muted-foreground text-center py-3"
                role="status"
                aria-live="polite"
              >
                불러오는 중...
              </p>
            ) : entries.length > 0 ? (
              <div
                className="space-y-1.5"
                role="list"
                aria-label="연습 일지 목록"
              >
                {entries.map((entry) => (
                  <div role="listitem" key={entry.id}>
                    <JournalEntryItem
                      entry={entry}
                      onDelete={handleDelete}
                      onEdit={setEditTarget}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground"
                role="status"
              >
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                <p className="text-xs">작성된 연습 일지가 없습니다</p>
                <p className="text-[10px]">
                  아래 버튼을 눌러 첫 일지를 작성해보세요
                </p>
              </div>
            )}

            {/* 구분선 */}
            {entries.length > 0 && (
              <div className="border-t border-border/40" aria-hidden="true" />
            )}

            {/* 일지 작성 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="새 연습 일지 작성"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              연습 일지 작성
            </Button>
          </div>
        )}
      </div>

      {/* 작성 다이얼로그 */}
      <JournalFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        memberNames={memberNames}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <JournalFormDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          initialValues={editInitialValues}
          memberNames={memberNames}
          onSubmit={handleEdit}
          mode="edit"
        />
      )}
    </>
  );
}
