"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useAttendanceHeatmap } from "@/hooks/use-attendance-heatmap";
import type { AttendanceHeatmapData, HeatmapDayData } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const ACTIVITY_OPTIONS = ["연습", "공연", "이벤트", "모임", "스터디", "기타"];

// ─── 히트맵 색상 헬퍼 ────────────────────────────────────────

function heatColor(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count === 1) return "bg-green-200 dark:bg-green-900";
  if (count === 2) return "bg-green-400 dark:bg-green-700";
  if (count === 3) return "bg-green-600 dark:bg-green-500";
  return "bg-green-800 dark:bg-green-400";
}

// ─── 52주 × 7일 그리드 생성 헬퍼 ─────────────────────────────

/**
 * 해당 연도의 히트맵 그리드 데이터를 생성합니다.
 * GitHub 잔디밭과 동일하게 일요일부터 시작하는 주(column) 단위로 구성합니다.
 * 단, 표시 라벨은 월(Mon)~일(Sun) 순으로 표기합니다.
 */
function buildGridWeeks(
  year: number,
  dayMap: Map<string, HeatmapDayData>
): Array<Array<{ date: string; count: number; activities: string[] } | null>> {
  // 연도의 첫째 날과 마지막 날
  const firstDay = new Date(year, 0, 1); // Jan 1
  const lastDay = new Date(year, 11, 31); // Dec 31

  // 첫째 날의 요일 (0=일, 1=월, ..., 6=토)
  const firstDow = firstDay.getDay(); // 0=Sun
  // 그리드 시작: 첫째 날이 속한 주의 일요일
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - firstDow);

  const weeks: Array<Array<{ date: string; count: number; activities: string[] } | null>> = [];
  const cursor = new Date(gridStart);
  const today = new Date().toISOString().slice(0, 10);

  while (cursor <= lastDay) {
    const week: Array<{ date: string; count: number; activities: string[] } | null> = [];

    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const isCurrentYear = cursor.getFullYear() === year;
      const isFuture = dateStr > today;

      if (!isCurrentYear || isFuture) {
        week.push(null);
      } else {
        const dayData = dayMap.get(dateStr);
        week.push({
          date: dateStr,
          count: dayData?.count ?? 0,
          activities: dayData?.activities ?? [],
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

/**
 * 월 라벨 위치 계산: 각 월이 시작하는 주(column) 인덱스를 반환합니다.
 */
function buildMonthPositions(
  year: number,
  weeks: Array<Array<{ date: string } | null>>
): Array<{ label: string; colIdx: number }> {
  const positions: Array<{ label: string; colIdx: number }> = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIdx) => {
    for (const cell of week) {
      if (!cell) continue;
      const date = new Date(cell.date);
      const month = date.getMonth(); // 0-indexed
      if (date.getFullYear() === year && month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[month], colIdx: weekIdx });
        lastMonth = month;
      }
      break; // 주의 첫 번째 유효 날짜만 체크
    }
  });

  return positions;
}

// ─── 툴팁 컴포넌트 ───────────────────────────────────────────

function HeatmapTooltip({
  date,
  count,
  activities,
}: {
  date: string;
  count: number;
  activities: string[];
}) {
  const [m, d] = date.split("-");
  const label = `${parseInt(m)}월 ${parseInt(d)}일`;

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none">
      <div className="bg-popover border border-border rounded-md shadow-md px-2 py-1.5 text-[10px] whitespace-nowrap min-w-[80px]">
        <p className="font-medium text-foreground">{label}</p>
        {count === 0 ? (
          <p className="text-muted-foreground">활동 없음</p>
        ) : (
          <>
            <p className="text-green-600 font-medium">{count}회 활동</p>
            {activities.length > 0 && (
              <p className="text-muted-foreground truncate max-w-[120px]">
                {activities.join(", ")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── 히트맵 그리드 컴포넌트 ──────────────────────────────────

function HeatmapGrid({ heatmapData }: { heatmapData: AttendanceHeatmapData }) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const dayMap = useMemo(() => {
    const map = new Map<string, HeatmapDayData>();
    for (const d of heatmapData.days) {
      map.set(d.date, d);
    }
    return map;
  }, [heatmapData.days]);

  const weeks = useMemo(
    () => buildGridWeeks(heatmapData.year, dayMap),
    [heatmapData.year, dayMap]
  );

  const monthPositions = useMemo(
    () => buildMonthPositions(heatmapData.year, weeks),
    [heatmapData.year, weeks]
  );

  // 현재 hover 셀 데이터
  const hoveredCell = useMemo(() => {
    if (!hoveredDate) return null;
    const dayData = dayMap.get(hoveredDate);
    return {
      date: hoveredDate,
      count: dayData?.count ?? 0,
      activities: dayData?.activities ?? [],
    };
  }, [hoveredDate, dayMap]);

  return (
    <div className="space-y-1.5 overflow-x-auto">
      {/* 월 라벨 */}
      <div className="relative h-4" style={{ minWidth: `${weeks.length * 12}px` }}>
        {monthPositions.map(({ label, colIdx }) => (
          <span
            key={label}
            className="absolute text-[10px] text-muted-foreground"
            style={{ left: `${colIdx * 12}px` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* 요일 라벨 + 그리드 */}
      <div className="flex gap-1 items-start">
        {/* 요일 라벨 (월화수목금토일) */}
        <div className="flex flex-col gap-[2px] shrink-0 pt-0">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-[10px] w-5 text-[8px] text-muted-foreground flex items-center justify-end pr-0.5",
                // 짝수 인덱스만 표시 (공간 절약)
                i % 2 !== 0 && "invisible"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 주 단위 그리드 */}
        <div
          className="flex gap-[2px]"
          style={{ minWidth: `${weeks.length * 12}px` }}
        >
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[2px]">
              {week.map((cell, dayIdx) => {
                // 그리드 내 요일 인덱스: 0=일요일 → 표시는 0=월 순으로 재배치
                // week[0]=일, week[1]=월, ..., week[6]=토
                // 라벨 순서: 월~일 = dayIdx 1,2,3,4,5,6,0
                const isHovered = cell !== null && cell.date === hoveredDate;

                return (
                  <div
                    key={dayIdx}
                    className="relative"
                    onMouseEnter={() => cell && setHoveredDate(cell.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <div
                      className={cn(
                        "w-[10px] h-[10px] rounded-sm cursor-default transition-all",
                        cell === null
                          ? "bg-transparent"
                          : heatColor(cell.count),
                        isHovered && "ring-1 ring-foreground/40 scale-125"
                      )}
                    />
                    {isHovered && hoveredCell && (
                      <HeatmapTooltip
                        date={hoveredCell.date}
                        count={hoveredCell.count}
                        activities={hoveredCell.activities}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[9px] text-muted-foreground">적음</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn("w-[10px] h-[10px] rounded-sm", heatColor(level))}
          />
        ))}
        <span className="text-[9px] text-muted-foreground">많음</span>
      </div>
    </div>
  );
}

// ─── 멤버 추가 다이얼로그 ─────────────────────────────────────

function AddMemberDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_NAME_REQUIRED);
      return;
    }
    onAdd(trimmed);
    setName("");
  }

  function handleClose() {
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">멤버 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">이름</Label>
            <Input
              placeholder="멤버 이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="h-8 text-xs"
              maxLength={20}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 활동 추가 다이얼로그 ─────────────────────────────────────

function AddActivityDialog({
  open,
  memberName,
  onClose,
  onAdd,
}: {
  open: boolean;
  memberName: string;
  onClose: () => void;
  onAdd: (date: string, activity: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [activity, setActivity] = useState(ACTIVITY_OPTIONS[0]);

  function handleSubmit() {
    if (!date) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_DATE_REQUIRED);
      return;
    }
    if (!activity) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_TYPE_REQUIRED);
      return;
    }
    onAdd(date, activity);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            활동 기록 — {memberName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">활동 종류</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 멤버 패널 컴포넌트 ──────────────────────────────────────

function MemberHeatmapPanel({
  memberName,
  year,
  heatmapData,
  isMostActive,
  onAddActivity,
  onRemoveMember,
  onGenerateDemo,
}: {
  memberName: string;
  year: number;
  heatmapData: AttendanceHeatmapData;
  isMostActive: boolean;
  onAddActivity: (memberName: string) => void;
  onRemoveMember: (memberName: string) => void;
  onGenerateDemo: (memberName: string) => void;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      {/* 헤더: 이름 + 배지 + 버튼 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium flex-1 truncate">{memberName}</span>

        {isMostActive && (
          <span className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 rounded-full font-medium inline-flex items-center gap-0.5">
            <Trophy className="h-2.5 w-2.5" />
            최다 활동
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => onGenerateDemo(memberName)}
          title="데모 데이터 생성"
        >
          <Sparkles className="h-3 w-3 mr-0.5" />
          데모
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px]"
          onClick={() => onAddActivity(memberName)}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          활동
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1 text-muted-foreground hover:text-red-500"
          onClick={() => onRemoveMember(memberName)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 연간 통계 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>
          총{" "}
          <span className="font-semibold text-green-600">
            {heatmapData.totalActiveDays}
          </span>
          일 활동
        </span>
        <span>
          최장{" "}
          <span className="font-semibold text-foreground">
            {heatmapData.longestStreak}
          </span>
          일 연속
        </span>
        <span className="text-muted-foreground">{year}년</span>
      </div>

      {/* 히트맵 그리드 */}
      <HeatmapGrid heatmapData={heatmapData} />
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface AttendanceHeatmapCardProps {
  groupId: string;
}

export function AttendanceHeatmapCard({ groupId }: AttendanceHeatmapCardProps) {
  const [open, setOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [activityTarget, setActivityTarget] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const [selectedYear] = useState(currentYear);

  const {
    memberNames,
    addMember,
    removeMember,
    addActivity,
    generateDemoData,
    getHeatmapData,
    totalMembers,
    mostActiveMember,
  } = useAttendanceHeatmap(groupId);

  // 멤버 선택 초기화: memberNames가 바뀌면 첫 번째 멤버 선택
  const displayMember =
    selectedMember && memberNames.includes(selectedMember)
      ? selectedMember
      : memberNames[0] ?? "";

  // 현재 표시할 멤버의 히트맵 데이터
  const heatmapData = useMemo(
    () =>
      displayMember
        ? getHeatmapData(displayMember, selectedYear)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayMember, selectedYear, memberNames]
  );

  // ── 핸들러 ───────────────────────────────────────────────

  function handleAddMember(name: string) {
    const ok = addMember(name);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_DUPLICATE_MEMBER);
      return;
    }
    toast.success(`${name} 멤버가 추가되었습니다.`);
    setSelectedMember(name);
    setAddMemberOpen(false);
  }

  function handleRemoveMember(name: string) {
    const ok = removeMember(name);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_MEMBER_DELETE_ERROR);
      return;
    }
    toast.success(`${name} 멤버가 삭제되었습니다.`);
    if (selectedMember === name) setSelectedMember("");
  }

  function handleAddActivity(date: string, activity: string) {
    if (!activityTarget) return;
    const ok = addActivity(activityTarget, date, activity);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_SAVE_ERROR);
      return;
    }
    toast.success(`${activityTarget}: ${activity} 활동이 기록되었습니다.`);
  }

  function handleGenerateDemo(name: string) {
    const ok = generateDemoData(name);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_DEMO_ERROR);
      return;
    }
    toast.success(`${name}의 데모 데이터가 생성되었습니다.`);
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">출석 히트맵</span>
                {totalMembers > 0 && (
                  <span className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 rounded-full">
                    {totalMembers}명
                  </span>
                )}
                {mostActiveMember && (
                  <span className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 rounded-full hidden sm:inline-flex items-center gap-0.5">
                    <Trophy className="h-2.5 w-2.5" />
                    {mostActiveMember}
                  </span>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t pt-3">
              {/* 멤버가 없을 때 */}
              {memberNames.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  등록된 멤버가 없습니다. 멤버를 추가해주세요.
                </p>
              ) : (
                <>
                  {/* 멤버 선택 드롭다운 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                      <Users className="h-3 w-3" />
                      멤버 선택
                    </div>
                    <Select
                      value={displayMember}
                      onValueChange={setSelectedMember}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1 max-w-[180px]">
                        <SelectValue placeholder="멤버 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberNames.map((name) => (
                          <SelectItem key={name} value={name} className="text-xs">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 선택된 멤버 히트맵 */}
                  {heatmapData && displayMember && (
                    <MemberHeatmapPanel
                      memberName={displayMember}
                      year={selectedYear}
                      heatmapData={heatmapData}
                      isMostActive={mostActiveMember === displayMember}
                      onAddActivity={(name) => setActivityTarget(name)}
                      onRemoveMember={handleRemoveMember}
                      onGenerateDemo={handleGenerateDemo}
                    />
                  )}
                </>
              )}

              {/* 멤버 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setAddMemberOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                멤버 추가
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 다이얼로그 */}
      <AddMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onAdd={handleAddMember}
      />
      <AddActivityDialog
        open={activityTarget !== null}
        memberName={activityTarget ?? ""}
        onClose={() => setActivityTarget(null)}
        onAdd={handleAddActivity}
      />
    </>
  );
}
