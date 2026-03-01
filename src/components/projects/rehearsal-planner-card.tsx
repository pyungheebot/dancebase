"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useRehearsalPlanner } from "@/hooks/use-rehearsal-planner";
import type { RehearsalWeek } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 유틸 함수
// ============================================

/** D-Day 숫자 → 표시 문자열 */
function formatDDay(dday: number | null): string {
  if (dday === null) return "";
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

/** D-Day에 따른 배지 색상 */
function getDDayClass(dday: number | null): string {
  if (dday === null) return "bg-muted text-muted-foreground";
  if (dday < 0) return "bg-red-100 text-red-600";
  if (dday === 0) return "bg-red-100 text-red-600";
  if (dday <= 7) return "bg-orange-100 text-orange-700";
  if (dday <= 14) return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

/** YYYY-MM-DD → 한국어 날짜 */

/** 주차별 색상 (6주→진한 색, 1주→밝은 색) */
function getWeekColor(weekNumber: number): string {
  const colors: Record<number, string> = {
    6: "bg-violet-500",
    5: "bg-blue-500",
    4: "bg-cyan-500",
    3: "bg-teal-500",
    2: "bg-amber-500",
    1: "bg-rose-500",
  };
  return colors[weekNumber] ?? "bg-muted";
}

function getWeekProgressColor(weekNumber: number): string {
  const colors: Record<number, string> = {
    6: "[&>div]:bg-violet-500",
    5: "[&>div]:bg-blue-500",
    4: "[&>div]:bg-cyan-500",
    3: "[&>div]:bg-teal-500",
    2: "[&>div]:bg-amber-500",
    1: "[&>div]:bg-rose-500",
  };
  return colors[weekNumber] ?? "";
}

// ============================================
// 플랜 생성 폼
// ============================================

type CreatePlanFormProps = {
  onSubmit: (performanceDate: string, title: string) => void;
};

function CreatePlanForm({ onSubmit }: CreatePlanFormProps) {
  const [performanceDate, setPerformanceDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 42); // 기본값: 6주 후
    return d.toISOString().split("T")[0];
  });
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("공연 제목을 입력해주세요");
      return;
    }
    if (!performanceDate) {
      toast.error("공연 날짜를 선택해주세요");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const perf = new Date(performanceDate);
    perf.setHours(0, 0, 0, 0);
    if (perf <= today) {
      toast.error("공연 날짜는 오늘 이후여야 합니다");
      return;
    }
    onSubmit(performanceDate, title.trim());
    toast.success("리허설 플래너가 생성되었습니다");
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground">
        공연 날짜를 입력하면 6주 리허설 플랜이 자동으로 생성됩니다.
      </p>
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">공연 제목 *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 2026 봄 정기공연"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">공연 날짜 *</label>
          <Input
            type="date"
            value={performanceDate}
            onChange={(e) => setPerformanceDate(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <Button size="sm" className="h-7 text-xs w-full gap-1" onClick={handleSubmit}>
        <Plus className="h-3 w-3" />
        리허설 플래너 생성
      </Button>
    </div>
  );
}

// ============================================
// 단일 주차 아이템
// ============================================

type WeekItemProps = {
  week: RehearsalWeek;
  progress: number;
  onToggle: (weekNumber: number, checkId: string) => void;
  isLast: boolean;
};

function WeekItem({ week, progress, onToggle, isLast }: WeekItemProps) {
  const [open, setOpen] = useState(false);
  const isComplete = progress === 100;
  const dotColor = getWeekColor(week.weekNumber);
  const progressBarColor = getWeekProgressColor(week.weekNumber);
  const checkedCount = week.checks.filter((c) => c.checked).length;

  return (
    <div className="flex gap-3">
      {/* 타임라인 세로선 + 점 */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-3 h-3 rounded-full shrink-0 mt-1.5 border-2 border-background shadow-sm ${
            isComplete ? "bg-green-500" : dotColor
          }`}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-1" />
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 pb-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full text-left"
            >
              {/* 주차 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium">
                        {week.weekNumber === 1
                          ? "1주차 (공연 직전)"
                          : `${week.weekNumber}주차`}
                      </span>
                      <Badge
                        className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground shrink-0"
                        variant="secondary"
                      >
                        {week.label}
                      </Badge>
                      {isComplete && (
                        <Badge
                          className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 shrink-0"
                          variant="secondary"
                        >
                          완료
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground truncate">
                        {week.goal}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-muted-foreground mt-0.5">
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {checkedCount}/{week.checks.length} 완료
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={`h-1.5 ${progressBarColor}`}
                />
              </div>
            </button>
          </CollapsibleTrigger>

          {/* 체크리스트 */}
          <CollapsibleContent>
            <ul className="mt-2 space-y-1.5 pl-1">
              {week.checks.map((check) => (
                <li key={check.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggle(week.weekNumber, check.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={check.checked ? "완료 취소" : "완료로 표시"}
                  >
                    {check.checked ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <span
                    className={`text-xs flex-1 ${
                      check.checked ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {check.title}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type RehearsalPlannerCardProps = {
  groupId: string;
  projectId: string;
  canEdit?: boolean;
};

export function RehearsalPlannerCard({
  groupId,
  projectId,
  canEdit = false,
}: RehearsalPlannerCardProps) {
  const [sectionOpen, setSectionOpen] = useState(true);

  const {
    plan,
    createPlan,
    toggleCheck,
    deletePlan,
    getWeekProgress,
    overallProgress,
    getDDay,
  } = useRehearsalPlanner(groupId, projectId);

  const dday = getDDay();
  const overall = overallProgress();
  const ddayText = formatDDay(dday);
  const ddayClass = getDDayClass(dday);

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1.5 group"
          onClick={() => setSectionOpen((v) => !v)}
        >
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">리허설 플래너</span>
          {plan && (
            <>
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${
                  overall === 100
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
                variant="secondary"
              >
                {overall}%
              </Badge>
              {dday !== null && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${ddayClass}`}
                  variant="secondary"
                >
                  {ddayText}
                </Badge>
              )}
            </>
          )}
          <span className="text-muted-foreground ml-1">
            {sectionOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {/* 삭제 버튼 */}
        {plan && canEdit && sectionOpen && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">
                  리허설 플래너 초기화
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  현재 리허설 플랜과 모든 체크 기록이 삭제됩니다. 이 작업은
                  되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-7 text-xs">
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  className="h-7 text-xs bg-destructive hover:bg-destructive/90"
                  onClick={() => {
                    deletePlan();
                    toast.success("리허설 플래너가 초기화되었습니다");
                  }}
                >
                  초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* 섹션 본문 */}
      {sectionOpen && (
        <div className="space-y-3 pl-1">
          {plan === null ? (
            /* 플랜 없음: 생성 폼 */
            canEdit ? (
              <CreatePlanForm onSubmit={createPlan} />
            ) : (
              <p className="text-[11px] text-muted-foreground pl-2">
                리허설 플래너가 아직 생성되지 않았습니다.
              </p>
            )
          ) : (
            /* 플랜 있음: 상세 뷰 */
            <div className="space-y-3">
              {/* 플랜 요약 카드 */}
              <div className="border rounded-lg px-3 py-2.5 bg-muted/30 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{plan.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>공연일: {formatYearMonthDay(plan.performanceDate)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {dday !== null && (
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${ddayClass}`}
                        variant="secondary"
                      >
                        {ddayText}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 전체 진행률 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>전체 진행률</span>
                    </div>
                    <span className="text-[10px] font-medium text-foreground">
                      {overall}%
                    </span>
                  </div>
                  <Progress
                    value={overall}
                    className={`h-2 ${
                      overall === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-indigo-500"
                    }`}
                  />
                </div>
              </div>

              {/* 주차별 타임라인 */}
              <div className="pl-2">
                {plan.weeks.map((week, idx) => (
                  <WeekItem
                    key={week.weekNumber}
                    week={week}
                    progress={getWeekProgress(week.weekNumber)}
                    onToggle={toggleCheck}
                    isLast={idx === plan.weeks.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
