"use client";

import { useState, useEffect, startTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  ClipboardList,
} from "lucide-react";
import { useOnboardingChecklist } from "@/hooks/use-onboarding-checklist";
import type { OnboardingStep } from "@/types";

// ============================================
// Props
// ============================================

type OnboardingChecklistCardProps = {
  groupId: string;
  userId: string;
};

// ============================================
// 원형 SVG 진행률 게이지
// ============================================

function CircularGauge({
  rate,
  size = 52,
}: {
  rate: number;
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden="true"
    >
      {/* 배경 트랙 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      {/* 진행 호 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-500"
      />
      {/* 중앙 텍스트 - rotate 되어있으므로 반대로 돌려줌 */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.22}
        fontWeight="600"
        fill="currentColor"
        className="text-foreground rotate-90"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px` }}
      >
        {rate}%
      </text>
    </svg>
  );
}

// ============================================
// 단계 항목 행
// ============================================

function StepRow({
  step,
  onToggle,
}: {
  step: OnboardingStep;
  onToggle: (id: string) => void;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => onToggle(step.id)}
        className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        aria-label={step.completed ? `${step.title} 완료 취소` : `${step.title} 완료 표시`}
      >
        {step.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span
          className={`text-xs font-medium leading-snug block ${
            step.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {step.title}
        </span>
        {!step.completed && (
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
            {step.description}
          </p>
        )}
      </div>
    </li>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function OnboardingChecklistCard({
  groupId,
  userId,
}: OnboardingChecklistCardProps) {
  const {
    steps,
    completedCount,
    totalCount,
    completionRate,
    mounted,
    toggleStep,
    isFullyOnboarded,
  } = useOnboardingChecklist(groupId, userId);

  const allDone = isFullyOnboarded();

  // 전체 완료 시 카드 자동 접힘
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (allDone) {
      startTransition(() => { setOpen(false); });
    }
  }, [allDone]);

  // 마운트 전에는 렌더링하지 않음 (SSR/hydration 불일치 방지)
  if (!mounted) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="mb-3 border-primary/20 bg-primary/5">
        {/* 카드 헤더 */}
        <CardHeader className="pb-0 pt-3 px-3">
          <div className="flex items-center justify-between gap-2">
            {/* 좌측: 아이콘 + 타이틀 */}
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-semibold text-foreground truncate">
                신입 멤버 온보딩
              </span>
            </div>

            {/* 우측: 카운트 + 토글 버튼 */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label={open ? "온보딩 접기" : "온보딩 펼치기"}
              >
                <span>
                  {completedCount}/{totalCount}
                </span>
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        {/* 접히는 콘텐츠 영역 */}
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-3">
            {/* 전체 완료 축하 배너 */}
            {allDone ? (
              <div className="flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-3 mb-3">
                {/* 원형 게이지 */}
                <CircularGauge rate={completionRate} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                      온보딩 완료!
                    </p>
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700 gap-0.5">
                      <PartyPopper className="h-2.5 w-2.5" />
                      완료
                    </Badge>
                  </div>
                  <p className="text-[10px] text-green-600/80 dark:text-green-500/80 mt-0.5 leading-snug">
                    모든 단계를 완료했습니다. 즐거운 활동 되세요!
                  </p>
                </div>
              </div>
            ) : (
              /* 진행 중 상태: 원형 게이지 + 안내 */
              <div className="flex items-center gap-3 mb-3">
                <CircularGauge rate={completionRate} size={52} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {completedCount === 0
                      ? "온보딩을 시작해보세요"
                      : `${completedCount}개 완료했어요!`}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    {totalCount - completedCount}단계 남았습니다
                  </p>
                </div>
              </div>
            )}

            {/* 단계 목록 */}
            <ul className="space-y-2.5">
              {steps.map((step) => (
                <StepRow key={step.id} step={step} onToggle={toggleStep} />
              ))}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
