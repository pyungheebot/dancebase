"use client";

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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  Copy,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Star,
  Clock,
  Dumbbell,
} from "lucide-react";
import { usePracticeWeeklyDigest } from "@/hooks/use-practice-weekly-digest";
import type { PracticeWeeklyDigestStat } from "@/types";

// ============================================================
// 유틸리티
// ============================================================

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/** MM/DD 형식 날짜 */
function formatMD(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  return `${mm}/${dd}`;
}

// ============================================================
// 변화율 배지
// ============================================================

function ChangeBadge({ changeRate }: { changeRate: number | null }) {
  if (changeRate === null) {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] px-1.5 py-0 gap-0.5 font-normal"
      >
        <Minus className="h-2.5 w-2.5" />
        전주 없음
      </Badge>
    );
  }

  if (changeRate === 0) {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] px-1.5 py-0 gap-0.5 font-normal"
      >
        <Minus className="h-2.5 w-2.5" />
        동일
      </Badge>
    );
  }

  const isUp = changeRate > 0;
  return (
    <Badge
      className={`text-[10px] px-1.5 py-0 gap-0.5 font-normal border-0 ${
        isUp
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      }`}
    >
      {isUp ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {isUp ? "+" : ""}
      {changeRate}%
    </Badge>
  );
}

// ============================================================
// 통계 셀 (4칸 그리드 각 칸)
// ============================================================

function StatCell({
  icon,
  label,
  value,
  unit,
  stat,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  stat: PracticeWeeklyDigestStat;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-2.5 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
          {icon}
          {label}
        </span>
        <ChangeBadge changeRate={stat.changeRate} />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold tabular-nums leading-tight">
          {value}
        </span>
        {unit && (
          <span className="text-[10px] text-muted-foreground font-normal">
            {unit}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        전주 {stat.previous === 0 ? "없음" : typeof value === "string" && unit === "분" ? formatMinutes(stat.previous) : `${stat.previous}${unit ?? ""}`}
      </span>
    </div>
  );
}

// ============================================================
// 주간 미니 도트 (월~일 연습 여부)
// ============================================================

function WeekDots({
  weekStart,
  practicedDates,
}: {
  weekStart: string;
  practicedDates: string[];
}) {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const practiced = new Set(practicedDates);
  const todayStr = (() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  return (
    <div className="flex items-center gap-1">
      {days.map((label, idx) => {
        const d = new Date(weekStart + "T00:00:00");
        d.setDate(d.getDate() + idx);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${day}`;
        const isPracticed = practiced.has(dateStr);
        const isToday = dateStr === todayStr;
        const isFuture = dateStr > todayStr;

        return (
          <div key={idx} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium transition-colors ${
                isToday
                  ? "bg-primary text-primary-foreground"
                  : isPracticed
                  ? "bg-blue-500 text-white"
                  : isFuture
                  ? "bg-muted/30 text-muted-foreground/40"
                  : "bg-muted text-muted-foreground/60"
              }`}
              title={`${dateStr}${isPracticed ? " (연습함)" : ""}`}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 별점 표시
// ============================================================

function StarDisplay({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-xs leading-none ${
            s <= filled ? "text-yellow-400" : "text-muted-foreground/25"
          }`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ============================================================
// 메인 카드
// ============================================================

export function PracticeWeeklyDigestCard() {
  const { digest, loading } = usePracticeWeeklyDigest();
  const [open, setOpen] = useState(true);
  const { copy } = useCopyToClipboard({
    successMessage: "요약이 클립보드에 복사되었습니다.",
    errorMessage: "복사에 실패했습니다. 브라우저 권한을 확인해주세요.",
  });

  async function handleCopy() {
    if (!digest) return;
    await copy(digest.summaryText);
  }

  // 주차 표시 (예: "2/24~3/1")
  const weekLabel =
    digest ? `${formatMD(digest.weekStart)}~${formatMD(digest.weekEnd)}` : "";

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between group"
              aria-expanded={open}
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4" aria-hidden />
                이번 주 연습 요약
                {weekLabel && (
                  <span className="text-[11px] font-normal text-muted-foreground ml-0.5">
                    {weekLabel}
                  </span>
                )}
              </CardTitle>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {/* 로딩 상태 */}
            {loading && (
              <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
                불러오는 중...
              </div>
            )}

            {/* 데이터 없음 */}
            {!loading && !digest?.hasData && (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  아직 연습 기록이 없습니다.
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  연습 일지에 기록을 추가하면 주간 요약이 표시됩니다.
                </p>
              </div>
            )}

            {/* 정상 데이터 */}
            {!loading && digest?.hasData && (
              <>
                {/* 주간 도트 & 연속일 */}
                <div className="flex items-center justify-between">
                  <WeekDots
                    weekStart={digest.weekStart}
                    practicedDates={digest.practicedDates}
                  />
                  {digest.streakDays > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold tabular-nums">
                        {digest.streakDays}일 연속
                      </span>
                    </div>
                  )}
                </div>

                {/* 4칸 그리드 통계 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* 연습 횟수 */}
                  <StatCell
                    icon={<Dumbbell className="h-3 w-3" />}
                    label="연습 횟수"
                    value={digest.practiceCount.current}
                    unit="회"
                    stat={digest.practiceCount}
                  />

                  {/* 총 시간 */}
                  <StatCell
                    icon={<Clock className="h-3 w-3" />}
                    label="총 시간"
                    value={
                      digest.totalMinutes.current === 0
                        ? "0"
                        : formatMinutes(digest.totalMinutes.current)
                    }
                    unit={digest.totalMinutes.current === 0 ? "분" : undefined}
                    stat={{
                      ...digest.totalMinutes,
                    }}
                  />

                  {/* 평균 만족도 */}
                  <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-2.5 py-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <Star className="h-3 w-3" />
                        평균 만족도
                      </span>
                      <ChangeBadge changeRate={digest.averageRating.changeRate} />
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      {digest.averageRating.current > 0 ? (
                        <>
                          <span className="text-lg font-bold tabular-nums leading-tight">
                            {digest.averageRating.current.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            / 5
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          -
                        </span>
                      )}
                    </div>
                    {digest.averageRating.current > 0 && (
                      <StarDisplay value={digest.averageRating.current} />
                    )}
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      전주{" "}
                      {digest.averageRating.previous > 0
                        ? `${digest.averageRating.previous.toFixed(1)}점`
                        : "없음"}
                    </span>
                  </div>

                  {/* 연속 일수 */}
                  <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-2.5 py-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <Flame className="h-3 w-3" />
                      연속 일수
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-bold tabular-nums leading-tight">
                        {digest.streakDays}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        일
                      </span>
                    </div>
                    {digest.topCategory && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        집중:{" "}
                        <span className="text-foreground font-medium">
                          {digest.topCategory}
                        </span>
                      </span>
                    )}
                    {!digest.topCategory && (
                      <span className="text-[10px] text-muted-foreground">
                        오늘 기준
                      </span>
                    )}
                  </div>
                </div>

                {/* 가장 많이 연습한 카테고리 */}
                {digest.topCategory && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
                    <BarChart2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="text-[11px] text-blue-700 dark:text-blue-300">
                      이번 주 가장 많이:{" "}
                      <span className="font-semibold">{digest.topCategory}</span>
                    </span>
                  </div>
                )}

                {/* 요약 텍스트 + 복사 버튼 */}
                <div className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2">
                  <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
                    {digest.summaryText}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs shrink-0 gap-1 px-2"
                    onClick={handleCopy}
                    aria-label="요약 복사"
                  >
                    <Copy className="h-3 w-3" />
                    복사
                  </Button>
                </div>
              </>
            )}

            {/* 이번 주 연습 기록 없지만 과거 데이터 있을 때 */}
            {!loading &&
              digest?.hasData &&
              digest.practiceCount.current === 0 && (
                <div className="rounded-lg bg-muted/30 px-3 py-3 text-center space-y-0.5">
                  <p className="text-xs font-medium">이번 주 연습 기록 없음</p>
                  <p className="text-[10px] text-muted-foreground">
                    연습 일지에 이번 주 기록을 추가해보세요.
                  </p>
                </div>
              )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
