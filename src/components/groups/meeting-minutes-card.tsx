"use client";

// ============================================
// 그룹 회의록 카드 - 컨테이너 컴포넌트
// 세부 구현은 ./meeting-minutes/ 하위 파일 참조
// ============================================

import { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMeetingMinutesMemo } from "@/hooks/use-meeting-minutes";
import type { MeetingMinutesType } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import {
  MeetingMinutesDialog,
  MinutesItem,
  TYPE_META,
  TYPE_OPTIONS,
} from "./meeting-minutes";

// ============================================
// 메인 카드 Props 타입
// ============================================

type MeetingMinutesCardProps = {
  groupId: string;
  memberNames: string[];
};

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function MeetingMinutesCard({
  groupId,
  memberNames,
}: MeetingMinutesCardProps) {
  // 카드 접힘/펼침 상태
  const [collapsed, setCollapsed] = useState(false);
  // 회의록 작성 다이얼로그 오픈 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  // 유형 필터 상태
  const [filterType, setFilterType] = useState<MeetingMinutesType | "all">(
    "all"
  );

  const {
    entries,
    addMinutes,
    deleteMinutes,
    getByType,
    totalMeetings,
    totalActionItems,
    pendingActionItems,
    recentMeeting,
  } = useMeetingMinutesMemo(groupId);

  // 필터 적용된 회의록 목록
  const filteredEntries =
    filterType === "all" ? entries : getByType(filterType);

  // 회의록 삭제 핸들러
  const handleDelete = (id: string) => {
    deleteMinutes(id);
    toast.success(TOAST.MEETING_MINUTES.DELETED);
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 카드 헤더 - 클릭 시 접힘/펼침 토글 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-label="그룹 회의록 카드 펼침/접힘"
        >
          <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-medium flex-1">그룹 회의록</span>

          {totalMeetings > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-blue-100 text-blue-700 font-semibold shrink-0">
              {totalMeetings}건
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2.5">
            {/* 통계 요약 - 총 회의 / 총 과제 / 미완 과제 */}
            {totalMeetings > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md px-2 py-1.5 text-center">
                  <p className="text-base font-bold text-blue-700 leading-none">
                    {totalMeetings}
                  </p>
                  <p className="text-[9px] text-blue-600 mt-0.5">총 회의</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-md px-2 py-1.5 text-center">
                  <p className="text-base font-bold text-orange-700 leading-none">
                    {totalActionItems}
                  </p>
                  <p className="text-[9px] text-orange-600 mt-0.5">총 과제</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-md px-2 py-1.5 text-center">
                  <p className="text-base font-bold text-green-700 leading-none">
                    {pendingActionItems}
                  </p>
                  <p className="text-[9px] text-green-600 mt-0.5">미완 과제</p>
                </div>
              </div>
            )}

            {/* 최근 회의 요약 */}
            {recentMeeting && (
              <div className="bg-muted/20 rounded-md px-2 py-1.5 flex items-center gap-1.5">
                <CalendarIcon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground">
                  최근 회의:
                </span>
                <span className="text-[10px] font-medium truncate flex-1">
                  {recentMeeting.title}
                </span>
                <span className="text-[9px] text-muted-foreground shrink-0">
                  {formatYearMonthDay(recentMeeting.date)}
                </span>
              </div>
            )}

            {/* 유형 필터 버튼 그룹 */}
            {totalMeetings > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    filterType === "all"
                      ? "bg-blue-100 border-blue-300 text-blue-700 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  전체
                </button>
                {TYPE_OPTIONS.map((opt) => {
                  const count = getByType(opt.value).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterType(opt.value)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        filterType === opt.value
                          ? cn(
                              TYPE_META[opt.value].bgColor,
                              TYPE_META[opt.value].color,
                              "border-transparent font-semibold"
                            )
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {opt.label} {count}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 회의록 목록 */}
            {filteredEntries.length > 0 ? (
              <div className="space-y-1.5">
                {filteredEntries.map((entry) => (
                  <MinutesItem
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <FileText className="h-5 w-5" />
                <p className="text-xs">아직 회의록이 없습니다</p>
                <p className="text-[10px]">회의 내용을 기록해보세요</p>
              </div>
            )}

            {/* 목록/추가 버튼 구분선 */}
            {filteredEntries.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 회의록 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
              aria-label="회의록 추가"
            >
              <Plus className="h-3 w-3" />
              회의록 추가
            </Button>
          </div>
        )}
      </div>

      {/* 회의록 작성 다이얼로그 */}
      <MeetingMinutesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberNames={memberNames}
        onAdd={addMinutes}
      />
    </>
  );
}
