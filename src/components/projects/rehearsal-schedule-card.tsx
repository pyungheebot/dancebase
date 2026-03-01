"use client";

import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  useRehearsalSchedule,
  type AddRehearsalParams,
} from "@/hooks/use-rehearsal-schedule";
import type {
  RehearsalScheduleItem,
  RehearsalScheduleStatus as RehearsalStatus,
} from "@/types";

import { ALL_STATUSES_FILTER, STATUS_LABELS } from "./rehearsal-schedule-types";
import { RehearsalDialog } from "./rehearsal-schedule-dialog";
import { RehearsalItem } from "./rehearsal-schedule-item";
import { RehearsalScheduleStats } from "./rehearsal-schedule-stats";

// ============================================================
// 타입
// ============================================================

type RehearsalScheduleCardProps = {
  projectId: string;
  /** 하위 호환용 (사용되지 않음) */
  groupId?: string;
  /** 하위 호환용 (사용되지 않음) */
  memberNames?: string[];
};

// ============================================================
// 메인 카드
// ============================================================

export function RehearsalScheduleCard({
  projectId,
}: RehearsalScheduleCardProps) {
  const {
    scheduleData,
    loading,
    addRehearsal,
    updateRehearsal,
    deleteRehearsal,
    toggleCheckItem,
    addCheckItem,
    removeCheckItem,
    completeRehearsal,
    cancelRehearsal,
    totalRehearsals,
    completedCount,
    upcomingRehearsals,
    checklistProgress,
    totalCheckItems,
    checkedItems,
  } = useRehearsalSchedule(projectId);

  // 다이얼로그 상태
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] =
    useState<RehearsalScheduleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<RehearsalStatus | "all">(
    "all"
  );

  // 정렬 & 필터
  const filteredRehearsals = [...scheduleData.rehearsals]
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .sort((a, b) => {
      if (a.status === "scheduled" && b.status !== "scheduled") return -1;
      if (a.status !== "scheduled" && b.status === "scheduled") return 1;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  // 핸들러
  const handleAdd = (params: AddRehearsalParams) => {
    addRehearsal(params);
    toast.success(TOAST.REHEARSAL_SCHEDULE.ADDED);
  };

  const handleUpdate = (params: AddRehearsalParams) => {
    if (!editingRehearsal) return;
    updateRehearsal(editingRehearsal.id, params);
    toast.success(TOAST.REHEARSAL_SCHEDULE.UPDATED);
    setEditingRehearsal(null);
  };

  const handleDelete = (id: string) => {
    deleteRehearsal(id);
    toast.success(TOAST.REHEARSAL_SCHEDULE.DELETED);
    setDeleteConfirmId(null);
  };

  const handleComplete = (id: string) => {
    completeRehearsal(id);
    toast.success(TOAST.REHEARSAL_SCHEDULE.COMPLETED);
  };

  const handleCancel = (id: string) => {
    cancelRehearsal(id);
    toast.success(TOAST.REHEARSAL_SCHEDULE.CANCELLED);
  };

  // 로딩
  if (loading) {
    return (
      <Card>
        <CardContent
          className="py-8 text-center text-xs text-gray-400"
          aria-live="polite"
          aria-busy="true"
        >
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              <CardTitle className="text-sm" id="rehearsal-schedule-heading">
                공연 리허설 스케줄러
              </CardTitle>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddDialogOpen(true)}
              aria-label="리허설 추가"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              추가
            </Button>
          </div>

          {/* 통계 요약 */}
          <RehearsalScheduleStats
            totalRehearsals={totalRehearsals}
            completedCount={completedCount}
            upcomingRehearsals={upcomingRehearsals}
            checklistProgress={checklistProgress}
            totalCheckItems={totalCheckItems}
            checkedItems={checkedItems}
          />
        </CardHeader>

        <CardContent className="pt-0">
          {/* 빈 상태 */}
          {totalRehearsals === 0 && (
            <div
              className="text-center py-8 text-gray-400"
              aria-label="리허설 일정 없음"
            >
              <Calendar
                className="h-8 w-8 mx-auto mb-2 opacity-30"
                aria-hidden="true"
              />
              <p className="text-xs">아직 리허설 일정이 없습니다.</p>
              <p className="text-[10px] mt-0.5">
                전체 런스루, 드레스 리허설 등 일정을 추가해보세요.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                첫 리허설 추가
              </Button>
            </div>
          )}

          {/* 상태 필터 탭 */}
          {totalRehearsals > 0 && (
            <div
              className="flex gap-1 mb-3 flex-wrap"
              role="group"
              aria-label="리허설 상태 필터"
            >
              {ALL_STATUSES_FILTER.map((s) => {
                const count =
                  s === "all"
                    ? totalRehearsals
                    : scheduleData.rehearsals.filter((r) => r.status === s)
                        .length;
                const label = s === "all" ? "전체" : STATUS_LABELS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "text-gray-500 border-gray-200 hover:border-indigo-300"
                    }`}
                    aria-pressed={statusFilter === s}
                    aria-label={`${label} (${count}개)`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* 필터 결과 없음 */}
          {totalRehearsals > 0 && filteredRehearsals.length === 0 && (
            <div
              className="text-center py-6 text-gray-400"
              aria-live="polite"
            >
              <p className="text-xs">해당 상태의 리허설이 없습니다.</p>
            </div>
          )}

          {/* 타임라인 목록 */}
          {filteredRehearsals.length > 0 && (
            <ol
              role="list"
              aria-label="리허설 타임라인"
              aria-live="polite"
            >
              {filteredRehearsals.map((rehearsal) => (
                <li key={rehearsal.id} role="listitem">
                  <RehearsalItem
                    rehearsal={rehearsal}
                    onEdit={(r) => setEditingRehearsal(r)}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                    onToggleCheck={toggleCheckItem}
                    onAddCheck={addCheckItem}
                    onRemoveCheck={removeCheckItem}
                  />
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* 리허설 추가 다이얼로그 */}
      <RehearsalDialog
        open={addDialogOpen}
        mode="add"
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
      />

      {/* 리허설 수정 다이얼로그 */}
      {editingRehearsal && (
        <RehearsalDialog
          open={!!editingRehearsal}
          mode="edit"
          initial={editingRehearsal}
          onClose={() => setEditingRehearsal(null)}
          onSubmit={handleUpdate}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
      >
        <DialogContent
          className="max-w-xs"
          aria-labelledby="delete-dialog-heading"
        >
          <DialogHeader>
            <DialogTitle id="delete-dialog-heading" className="text-sm">
              리허설 삭제
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-600 py-1">
            이 리허설 일정을 삭제하시겠습니까? 체크리스트도 함께 삭제됩니다.
          </p>
          <DialogFooter className="gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDeleteConfirmId(null)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
