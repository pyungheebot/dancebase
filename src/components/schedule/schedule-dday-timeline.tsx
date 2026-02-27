"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useScheduleDday } from "@/hooks/use-schedule-dday";
import type { DdayChecklistItem } from "@/types";

type ScheduleDdayTimelineProps = {
  scheduleId: string;
  /** 일정 시작 날짜 (ISO 8601) - D-N 계산 기준 */
  scheduleStartsAt: string;
  canEdit?: boolean;
};

const DDAY_OPTIONS = [
  { value: 7, label: "D-7" },
  { value: 5, label: "D-5" },
  { value: 3, label: "D-3" },
  { value: 1, label: "D-1" },
  { value: 0, label: "D-Day" },
];

const DDAY_GROUPS = [7, 3, 1, 0];

/** daysBefore 기준으로 현재 구간 계산 */
function getCurrentDayGroup(scheduleStartsAt: string): number | null {
  const now = new Date();
  const scheduleDate = new Date(scheduleStartsAt);
  const diffMs = scheduleDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 0;   // D-Day 또는 지난 일정
  if (diffDays <= 1) return 1;   // D-1 구간
  if (diffDays <= 3) return 3;   // D-3 구간
  if (diffDays <= 7) return 7;   // D-7 구간
  return null;                   // D-7 이전 (아직 멀었음)
}

/** 구간 라벨 */
function getDdayLabel(daysBefore: number): string {
  if (daysBefore === 0) return "D-Day";
  return `D-${daysBefore}`;
}

/** 구간 배지 색상 */
function getDdayBadgeClass(daysBefore: number, currentGroup: number | null, scheduleStartsAt: string): string {
  const now = new Date();
  const scheduleDate = new Date(scheduleStartsAt);
  const diffMs = scheduleDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 지난 구간 (이미 지나간 날짜 기준)
  const isPast = daysBefore === 0 ? diffDays < 0 : diffDays > 0 && diffDays > daysBefore;
  const isCurrent = daysBefore === currentGroup;

  if (isCurrent) return "bg-primary text-primary-foreground";
  if (isPast) return "bg-muted text-muted-foreground";
  return "bg-blue-100 text-blue-700";
}

/** 구간 원 색상 */
function getCircleClass(daysBefore: number, currentGroup: number | null, scheduleStartsAt: string): string {
  const now = new Date();
  const scheduleDate = new Date(scheduleStartsAt);
  const diffMs = scheduleDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isPast = daysBefore === 0 ? diffDays < 0 : diffDays > 0 && diffDays > daysBefore;
  const isCurrent = daysBefore === currentGroup;

  if (isCurrent) return "bg-primary border-primary";
  if (isPast) return "bg-muted border-muted-foreground/30";
  return "bg-background border-blue-400";
}

/** 그룹에 속하는 항목 필터링 */
function getItemsForGroup(items: DdayChecklistItem[], groupDaysBefore: number): DdayChecklistItem[] {
  // D-7 그룹: daysBefore >= 4 (4,5,6,7 전부)
  // D-3 그룹: daysBefore 2,3
  // D-1 그룹: daysBefore 1
  // D-0 그룹: daysBefore 0
  if (groupDaysBefore === 7) {
    return items.filter((item) => item.daysBefore >= 4);
  }
  if (groupDaysBefore === 3) {
    return items.filter((item) => item.daysBefore >= 2 && item.daysBefore <= 3);
  }
  if (groupDaysBefore === 1) {
    return items.filter((item) => item.daysBefore === 1);
  }
  if (groupDaysBefore === 0) {
    return items.filter((item) => item.daysBefore === 0);
  }
  return [];
}

export function ScheduleDdayTimeline({
  scheduleId,
  scheduleStartsAt,
  canEdit = false,
}: ScheduleDdayTimelineProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [newDaysBefore, setNewDaysBefore] = useState<string>("1");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { items, addItem, toggleItem, deleteItem, completionRate } =
    useScheduleDday(scheduleId);

  const currentGroup = getCurrentDayGroup(scheduleStartsAt);

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("항목 제목을 입력해주세요");
      return;
    }
    addItem(Number(newDaysBefore), trimmed);
    setNewTitle("");
    toast.success("항목을 추가했습니다");
  };

  const handleToggle = (id: string) => {
    toggleItem(id);
  };

  const handleDelete = (id: string, title: string) => {
    deleteItem(id);
    toast.success(`"${title}" 항목을 삭제했습니다`);
  };

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <button
        className="w-full flex items-center justify-between group"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">D-Day 준비</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${
              completionRate === 100
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            }`}
            variant="secondary"
          >
            {completionRate}%
          </Badge>
          {currentGroup !== null && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary" variant="secondary">
              {getDdayLabel(currentGroup)}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground">
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {/* 타임라인 본문 */}
      {!collapsed && (
        <div className="pl-1">
          <div className="relative">
            {/* 세로 라인 */}
            <div className="absolute left-3 top-0 bottom-0 w-px border-l-2 border-muted" />

            <div className="space-y-4">
              {DDAY_GROUPS.map((groupDaysBefore) => {
                const groupItems = getItemsForGroup(items, groupDaysBefore);
                const badgeClass = getDdayBadgeClass(groupDaysBefore, currentGroup, scheduleStartsAt);
                const circleClass = getCircleClass(groupDaysBefore, currentGroup, scheduleStartsAt);
                const isCurrent = groupDaysBefore === currentGroup;

                return (
                  <div key={groupDaysBefore} className="relative">
                    {/* 구간 라벨 */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${circleClass}`}
                      >
                        {isCurrent && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${badgeClass}`}
                        variant="secondary"
                      >
                        {getDdayLabel(groupDaysBefore)}
                      </Badge>
                    </div>

                    {/* 항목 목록 */}
                    <div className="ml-8 space-y-1">
                      {groupItems.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">항목 없음</p>
                      ) : (
                        groupItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 group/item"
                          >
                            <Checkbox
                              id={item.id}
                              checked={item.isDone}
                              onCheckedChange={() => handleToggle(item.id)}
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <label
                              htmlFor={item.id}
                              className={`text-xs flex-1 cursor-pointer select-none ${
                                item.isDone
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {item.title}
                            </label>
                            {canEdit && (
                              <button
                                onClick={() => handleDelete(item.id, item.title)}
                                className="opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                aria-label={`${item.title} 삭제`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 항목 추가 폼 */}
          {canEdit && (
            <div className="mt-3 ml-8">
              {adding ? (
                <div className="flex items-center gap-1.5">
                  <Select
                    value={newDaysBefore}
                    onValueChange={setNewDaysBefore}
                  >
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DDAY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="항목 제목"
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") {
                        setAdding(false);
                        setNewTitle("");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleAdd}
                  >
                    추가
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      setAdding(false);
                      setNewTitle("");
                    }}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setAdding(true)}
                >
                  <Plus className="h-3 w-3" />
                  항목 추가
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
