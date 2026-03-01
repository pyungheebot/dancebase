"use client";

import { useState, useCallback } from "react";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useTimeCapsule,
  usePracticeTimeCapsule,
  calcDaysLeft,
} from "@/hooks/use-time-capsule";
import type { TimeCapsule, TimeCapsuleEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { CapsuleItem } from "./capsule-item";
import { EntryItem } from "./entry-item";
import { CreateCapsuleDialog } from "./create-capsule-dialog";
import { CreateEntryDialog } from "./create-entry-dialog";

// ============================================
// 메인 컴포넌트
// ============================================

type TimeCapsuleCardProps = {
  groupId: string;
};

export function TimeCapsuleCard({ groupId }: TimeCapsuleCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createEntryDialogOpen, setCreateEntryDialogOpen] = useState(false);

  // 기본 타임캡슐 훅
  const {
    capsules,
    createCapsule,
    deleteCapsule,
    addMessage,
    sealCapsule,
    openCapsule,
    totalCapsules,
    sealedCount,
    nextOpenDate,
  } = useTimeCapsule(groupId);

  // 스냅샷 타임캡슐 훅
  const {
    entries,
    createEntry,
    deleteEntry,
    addEntryMessage,
    sealEntry,
    openEntry,
    totalEntries,
    sealedCount: entrySealedCount,
    nextOpenDate: entryNextOpenDate,
  } = usePracticeTimeCapsule(groupId);

  // useCallback으로 핸들러 메모이제이션 (React.memo 효과 극대화)
  const handleDelete = useCallback(
    (id: string) => {
      deleteCapsule(id);
      toast.success(TOAST.TIME_CAPSULE.DELETED);
    },
    [deleteCapsule]
  );

  const sortedCapsules = [...capsules].sort((a, b) => {
    const score = (c: TimeCapsule) => {
      if (c.isOpened) return 3;
      if (calcDaysLeft(c.openDate) <= 0) return 0;
      if (!c.isSealed) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  const sortedEntries = [...entries].sort((a, b) => {
    const score = (e: TimeCapsuleEntry) => {
      if (e.isOpened) return 3;
      if (calcDaysLeft(e.openDate) <= 0) return 0;
      if (!e.isSealed) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  const totalSealedAll = sealedCount + entrySealedCount;

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-medium flex-1">그룹 타임캡슐</span>
          {totalSealedAll > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0">
              봉인 {totalSealedAll}
            </span>
          )}
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="h-7 w-full">
              <TabsTrigger value="basic" className="flex-1 text-xs h-6">
                메시지 캡슐
                {totalCapsules > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {totalCapsules}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="snapshot" className="flex-1 text-xs h-6">
                스냅샷 캡슐
                {totalEntries > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {totalEntries}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* 메시지 캡슐 탭 */}
            <TabsContent value="basic" className="mt-2 space-y-2">
              {nextOpenDate && (
                <p className="text-[10px] text-muted-foreground px-0.5">
                  다음 개봉일: {formatYearMonthDay(nextOpenDate)} (D-
                  {Math.max(0, calcDaysLeft(nextOpenDate))})
                </p>
              )}
              {sortedCapsules.length > 0 ? (
                <div className="space-y-1.5">
                  {sortedCapsules.map((capsule) => (
                    <CapsuleItem
                      key={capsule.id}
                      capsule={capsule}
                      onDelete={handleDelete}
                      onSeal={sealCapsule}
                      onOpen={openCapsule}
                      onAddMessage={addMessage}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <p className="text-xs">아직 타임캡슐이 없습니다</p>
                  <p className="text-[10px]">
                    미래의 멤버들에게 메시지를 남겨보세요
                  </p>
                </div>
              )}
              {capsules.length > 0 && (
                <div className="border-t border-border/40" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setCreateDialogOpen(true)}
                disabled={totalCapsules >= 30}
              >
                <Plus className="h-3 w-3" />
                타임캡슐 만들기
                {totalCapsules >= 30 && (
                  <span className="ml-auto text-[10px] text-destructive">
                    최대 도달
                  </span>
                )}
              </Button>
            </TabsContent>

            {/* 스냅샷 캡슐 탭 */}
            <TabsContent value="snapshot" className="mt-2 space-y-2">
              <p className="text-[10px] text-muted-foreground px-0.5">
                그룹 목표, 레퍼토리, 사진을 포함한 현재 상태 스냅샷을
                기록합니다.
              </p>
              {entryNextOpenDate && (
                <p className="text-[10px] text-muted-foreground px-0.5">
                  다음 개봉일: {formatYearMonthDay(entryNextOpenDate)} (D-
                  {Math.max(0, calcDaysLeft(entryNextOpenDate))})
                </p>
              )}
              {sortedEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {sortedEntries.map((entry) => (
                    <EntryItem
                      key={entry.id}
                      entry={entry}
                      onDelete={deleteEntry}
                      onSeal={sealEntry}
                      onOpen={openEntry}
                      onAddMessage={addEntryMessage}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                  <PackageOpen className="h-5 w-5" />
                  <p className="text-xs">아직 스냅샷 타임캡슐이 없습니다</p>
                  <p className="text-[10px]">
                    지금 이 순간의 그룹 상태를 기록해 두세요
                  </p>
                </div>
              )}
              {entries.length > 0 && (
                <div className="border-t border-border/40" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setCreateEntryDialogOpen(true)}
                disabled={totalEntries >= 30}
              >
                <Plus className="h-3 w-3" />
                스냅샷 캡슐 만들기
                {totalEntries >= 30 && (
                  <span className="ml-auto text-[10px] text-destructive">
                    최대 도달
                  </span>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 기본 캡슐 생성 다이얼로그 */}
      <CreateCapsuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createCapsule}
        totalCount={totalCapsules}
      />

      {/* 스냅샷 캡슐 생성 다이얼로그 */}
      <CreateEntryDialog
        open={createEntryDialogOpen}
        onOpenChange={setCreateEntryDialogOpen}
        onCreate={createEntry}
        totalCount={totalEntries}
      />
    </>
  );
}
