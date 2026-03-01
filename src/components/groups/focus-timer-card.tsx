"use client";

import { useState } from "react";
import {
  Timer,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  Clock,
  CalendarDays,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFocusTimer, phaseLabel } from "@/hooks/use-focus-timer";
import type { FocusTimerPhase, FocusTimerSession } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ============================================
// 헬퍼
// ============================================

function formatMM_SS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// ============================================
// 페이즈 색상 맵
// ============================================

const PHASE_COLOR: Record<
  FocusTimerPhase,
  { ring: string; badge: string; text: string; fill: string }
> = {
  focus: {
    ring: "stroke-red-400",
    badge: "bg-red-100 text-red-700",
    text: "text-red-500",
    fill: "#f87171",
  },
  short_break: {
    ring: "stroke-green-400",
    badge: "bg-green-100 text-green-700",
    text: "text-green-500",
    fill: "#4ade80",
  },
  long_break: {
    ring: "stroke-blue-400",
    badge: "bg-blue-100 text-blue-700",
    text: "text-blue-500",
    fill: "#60a5fa",
  },
};

// ============================================
// 원형 프로그레스 SVG
// ============================================

function CircularProgress({
  progress,
  phase,
  secondsLeft,
}: {
  progress: number;
  phase: FocusTimerPhase;
  secondsLeft: number;
}) {
  const size = 140;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const colors = PHASE_COLOR[phase];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* 배경 트랙 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        {/* 진행 링 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s linear" }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute flex flex-col items-center gap-0.5">
        <span className="text-2xl font-mono font-bold tracking-tight leading-none">
          {formatMM_SS(secondsLeft)}
        </span>
        <span className={cn("text-[10px] font-medium", colors.text)}>
          {phaseLabel(phase)}
        </span>
      </div>
    </div>
  );
}

// ============================================
// 설정 숫자 조절 행
// ============================================

function ConfigRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-foreground flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="감소"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-xs font-mono w-10 text-center">
          {value}
          {unit}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="증가"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 세션 아이템
// ============================================

function SessionItem({ session }: { session: FocusTimerSession }) {
  return (
    <div className="bg-muted/30 rounded px-2 py-1.5 flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatMonthDay(session.date)}
      </span>
      <div className="flex-1 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] px-1.5 py-0 rounded bg-red-100 text-red-700 font-medium">
          집중 {session.focusMinutes}분
        </span>
        <span className="text-[10px] px-1.5 py-0 rounded bg-green-100 text-green-700 font-medium">
          휴식 {session.breakMinutes}분
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {session.completedCycles}사이클
      </span>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type FocusTimerCardProps = {
  groupId: string;
};

export function FocusTimerCard({ groupId }: FocusTimerCardProps) {
  const [open, setOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"today" | "week">("today");

  const {
    config,
    updateConfig,
    phase,
    cycleCount,
    isRunning,
    secondsLeft,
    progress,
    start,
    pause,
    reset,
    skip,
    todaySessions,
    weekSessions,
    todayFocusTime,
    weekFocusTime,
    totalSessions,
  } = useFocusTimer(groupId);

  const colors = PHASE_COLOR[phase];
  const displaySessions = historyTab === "today" ? todaySessions : weekSessions;

  function handleStart() {
    start();
    toast.success(`${phaseLabel(phase)} 타이머 시작`);
  }

  function handlePause() {
    pause();
    toast("타이머 일시정지");
  }

  function handleReset() {
    reset();
    toast("타이머 초기화");
  }

  function handleSkip() {
    skip();
    toast(`${phaseLabel(phase)} 건너뜀`);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="rounded-lg border bg-card">
        {/* ── 헤더 ── */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left"
            aria-expanded={open}
          >
            <Timer className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="text-xs font-medium flex-1">집중 모드 (뽀모도로)</span>

            {/* 오늘 집중 시간 배지 */}
            {todayFocusTime > 0 && (
              <span className="text-[10px] px-1.5 py-0 rounded bg-red-100 text-red-700 font-semibold shrink-0">
                오늘 {formatMinutes(todayFocusTime)}
              </span>
            )}

            {/* 사이클 배지 */}
            {cycleCount > 0 && (
              <span className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground font-medium shrink-0">
                {cycleCount}사이클
              </span>
            )}

            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {/* ── 원형 타이머 ── */}
            <div className="flex flex-col items-center gap-3 py-2">
              {/* 페이즈 배지 */}
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                  colors.badge
                )}
              >
                {phaseLabel(phase)}
              </span>

              <CircularProgress
                progress={progress}
                phase={phase}
                secondsLeft={secondsLeft}
              />

              {/* 컨트롤 버튼 */}
              <div className="flex items-center gap-1.5">
                {/* 리셋 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleReset}
                  aria-label="초기화"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>

                {/* 시작 / 일시정지 */}
                {isRunning ? (
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "h-8 px-4 text-xs font-semibold gap-1",
                      phase === "focus"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : phase === "short_break"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    )}
                    onClick={handlePause}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    일시정지
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "h-8 px-4 text-xs font-semibold gap-1",
                      phase === "focus"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : phase === "short_break"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    )}
                    onClick={handleStart}
                  >
                    <Play className="h-3.5 w-3.5" />
                    시작
                  </Button>
                )}

                {/* 스킵 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleSkip}
                  aria-label="건너뜀"
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
              </div>

              {/* 진행 정보 */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>완료 사이클: <strong className="text-foreground">{cycleCount}</strong></span>
                <span className="text-border">|</span>
                <span>
                  다음 긴 휴식:
                  <strong className="text-foreground ml-1">
                    {config.cyclesBeforeLongBreak - (cycleCount % config.cyclesBeforeLongBreak)}사이클 후
                  </strong>
                </span>
              </div>
            </div>

            {/* ── 구분선 ── */}
            <div className="border-t border-border/40" />

            {/* ── 설정 섹션 ── */}
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center gap-1.5 text-left"
                  aria-expanded={settingsOpen}
                >
                  <Settings2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium flex-1 text-muted-foreground">
                    타이머 설정
                  </span>
                  {settingsOpen ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="pt-2 space-y-2">
                  <ConfigRow
                    label="집중 시간"
                    value={config.focusDuration}
                    min={5}
                    max={60}
                    unit="분"
                    onChange={(v) => {
                      if (isRunning) {
                        toast.error("타이머 실행 중에는 설정을 변경할 수 없습니다.");
                        return;
                      }
                      updateConfig({ focusDuration: v });
                    }}
                  />
                  <ConfigRow
                    label="짧은 휴식"
                    value={config.shortBreak}
                    min={1}
                    max={30}
                    unit="분"
                    onChange={(v) => {
                      if (isRunning) {
                        toast.error("타이머 실행 중에는 설정을 변경할 수 없습니다.");
                        return;
                      }
                      updateConfig({ shortBreak: v });
                    }}
                  />
                  <ConfigRow
                    label="긴 휴식"
                    value={config.longBreak}
                    min={5}
                    max={60}
                    unit="분"
                    onChange={(v) => {
                      if (isRunning) {
                        toast.error("타이머 실행 중에는 설정을 변경할 수 없습니다.");
                        return;
                      }
                      updateConfig({ longBreak: v });
                    }}
                  />
                  <ConfigRow
                    label="긴 휴식 주기"
                    value={config.cyclesBeforeLongBreak}
                    min={2}
                    max={8}
                    unit="회"
                    onChange={(v) => {
                      if (isRunning) {
                        toast.error("타이머 실행 중에는 설정을 변경할 수 없습니다.");
                        return;
                      }
                      updateConfig({ cyclesBeforeLongBreak: v });
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    집중 {config.focusDuration}분 × {config.cyclesBeforeLongBreak}회 후 긴 휴식 {config.longBreak}분
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* ── 구분선 ── */}
            <div className="border-t border-border/40" />

            {/* ── 통계 요약 ── */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-0.5 bg-muted/20 rounded p-1.5">
                <Clock className="h-3 w-3 text-red-400" />
                <span className="text-[10px] font-semibold text-foreground">
                  {formatMinutes(todayFocusTime)}
                </span>
                <span className="text-[9px] text-muted-foreground">오늘</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-muted/20 rounded p-1.5">
                <CalendarDays className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-semibold text-foreground">
                  {formatMinutes(weekFocusTime)}
                </span>
                <span className="text-[9px] text-muted-foreground">이번 주</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-muted/20 rounded p-1.5">
                <Timer className="h-3 w-3 text-purple-400" />
                <span className="text-[10px] font-semibold text-foreground">
                  {totalSessions}회
                </span>
                <span className="text-[9px] text-muted-foreground">누적</span>
              </div>
            </div>

            {/* ── 세션 이력 ── */}
            <div className="space-y-1.5">
              {/* 탭 */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-medium transition-colors",
                    historyTab === "today"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setHistoryTab("today")}
                >
                  오늘
                </button>
                <button
                  type="button"
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-medium transition-colors",
                    historyTab === "week"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setHistoryTab("week")}
                >
                  이번 주
                </button>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {displaySessions.length}개 세션
                </span>
              </div>

              {/* 세션 목록 */}
              {displaySessions.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                  {[...displaySessions]
                    .reverse()
                    .slice(0, 20)
                    .map((s) => (
                      <SessionItem key={s.id} session={s} />
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 gap-1 text-muted-foreground">
                  <Timer className="h-5 w-5" />
                  <p className="text-xs">
                    {historyTab === "today"
                      ? "오늘 집중 기록이 없습니다"
                      : "이번 주 집중 기록이 없습니다"}
                  </p>
                  <p className="text-[10px]">타이머를 시작해 집중 시간을 기록해보세요</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
