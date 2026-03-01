"use client";

import { useState } from "react";
import { Target, TrendingUp, Calendar, Trophy, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoalProgressTracker } from "@/hooks/use-goal-progress-tracker";
import type { GoalProgressStatus } from "@/types";

// SVG 원형 프로그레스 상수
const CIRCLE_RADIUS = 40;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function getStatusColor(status: GoalProgressStatus): {
  stroke: string;
  text: string;
  bg: string;
} {
  switch (status) {
    case "achieved":
      return { stroke: "#22c55e", text: "text-green-600", bg: "bg-green-50" };
    case "achievable":
      return { stroke: "#22c55e", text: "text-green-600", bg: "bg-green-50" };
    case "warning":
      return { stroke: "#eab308", text: "text-yellow-600", bg: "bg-yellow-50" };
    case "impossible":
      return { stroke: "#ef4444", text: "text-red-500", bg: "bg-red-50" };
  }
}

function getStatusLabel(status: GoalProgressStatus): string {
  switch (status) {
    case "achieved":
      return "달성 완료";
    case "achievable":
      return "달성 가능";
    case "warning":
      return "위험";
    case "impossible":
      return "달성 불가";
  }
}

interface CircularProgressProps {
  progressRate: number;
  status: GoalProgressStatus;
  isAchieved: boolean;
}

function CircularProgress({ progressRate, status, isAchieved }: CircularProgressProps) {
  const { stroke, text } = getStatusColor(status);
  const dashOffset = CIRCLE_CIRCUMFERENCE - (progressRate / 100) * CIRCLE_CIRCUMFERENCE;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        className="-rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx="50"
          cy="50"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        {/* 진행 원 */}
        <circle
          cx="50"
          cy="50"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        {isAchieved ? (
          <Trophy className="h-5 w-5 text-green-500" />
        ) : (
          <>
            <span className={`text-xl font-bold tabular-nums leading-none ${text}`}>
              {progressRate}
            </span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">%</span>
          </>
        )}
      </div>
    </div>
  );
}

interface GoalSetFormProps {
  onSet: (rate: number) => void;
}

function GoalSetForm({ onSet }: GoalSetFormProps) {
  const [inputRate, setInputRate] = useState(80);

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Target className="h-3.5 w-3.5" />
        <span className="text-xs">이번 달 출석 목표를 설정하세요</span>
      </div>

      {/* 슬라이더 */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">목표 출석률</span>
          <span className="text-sm font-bold tabular-nums text-primary">{inputRate}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={inputRate}
          onChange={(e) => setInputRate(Number(e.target.value))}
          className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
        />
        <div className="flex justify-between">
          <span className="text-[9px] text-muted-foreground">10%</span>
          <span className="text-[9px] text-muted-foreground">100%</span>
        </div>
      </div>

      <Button
        size="sm"
        className="h-7 text-xs w-full"
        onClick={() => onSet(inputRate)}
      >
        <Target className="h-3 w-3 mr-1" />
        목표 설정
      </Button>
    </div>
  );
}

interface GoalProgressWidgetProps {
  groupId: string;
  userId: string;
}

export function GoalProgressWidget({ groupId, userId }: GoalProgressWidgetProps) {
  const { data, loading, setGoal } = useGoalProgressTracker(groupId, userId);
  const [collapsed, setCollapsed] = useState(false);
  const [showChangeGoal, setShowChangeGoal] = useState(false);

  const hasGoal = data?.setting !== null;

  return (
    <Card className="mb-3">
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">출석 목표 추적</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            <ChevronDown
              className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
              style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
            />
          </Button>
        </div>

        {/* 요약 배지 바 */}
        {!loading && hasGoal && data && (
          <div className="flex flex-wrap gap-1.5 pt-2 pb-2.5">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 gap-1 ${getStatusColor(data.status).bg}`}
            >
              <Target className="h-2.5 w-2.5" />
              목표 {data.setting!.targetRate}%
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
              <TrendingUp className="h-2.5 w-2.5" />
              현재 {data.currentRate}%
            </Badge>
            {data.isAchieved && (
              <Badge className="text-[10px] px-1.5 py-0 gap-1 bg-green-500 text-white hover:bg-green-600">
                <Trophy className="h-2.5 w-2.5" />
                달성!
              </Badge>
            )}
          </div>
        )}

        {!loading && !hasGoal && (
          <div className="pb-2.5 pt-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              목표 미설정
            </Badge>
          </div>
        )}
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <div className="space-y-2 pt-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !hasGoal || showChangeGoal ? (
            <GoalSetForm
              onSet={(rate) => {
                setGoal(rate);
                setShowChangeGoal(false);
              }}
            />
          ) : data ? (
            <div className="space-y-3 pt-1">
              {/* 원형 프로그레스 + 상태 */}
              <div className="flex items-center gap-4">
                <CircularProgress
                  progressRate={data.progressRate}
                  status={data.status}
                  isAchieved={data.isAchieved}
                />

                <div className="flex-1 space-y-1.5">
                  {/* 달성 축하 배지 */}
                  {data.isAchieved ? (
                    <div className="flex items-center gap-1.5">
                      <Badge className="text-[10px] px-2 py-0.5 gap-1 bg-green-500 text-white hover:bg-green-600">
                        <Trophy className="h-2.5 w-2.5" />
                        목표 달성 완료!
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 gap-1 ${getStatusColor(data.status).text} border-current`}
                      >
                        {getStatusLabel(data.status)}
                      </Badge>
                    </div>
                  )}

                  {/* 필요 출석 안내 */}
                  {!data.isAchieved && (
                    <p className="text-[10px] text-muted-foreground">
                      {data.neededAttendances > 0
                        ? `목표 달성까지 ${data.neededAttendances}회 더 필요`
                        : "지금 페이스라면 목표 달성 가능"}
                    </p>
                  )}

                  {/* 목표 변경 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-1.5 py-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowChangeGoal(true)}
                  >
                    목표 변경
                  </Button>
                </div>
              </div>

              {/* 통계 3칸 그리드 */}
              <div className="grid grid-cols-3 gap-2">
                {/* 현재 출석률 */}
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span
                    className={`text-base font-bold tabular-nums leading-none ${
                      data.currentRate >= (data.setting?.targetRate ?? 80)
                        ? "text-green-600"
                        : data.currentRate >= (data.setting?.targetRate ?? 80) * 0.7
                        ? "text-yellow-600"
                        : "text-red-500"
                    }`}
                  >
                    {data.currentRate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">
                    현재 출석률
                  </span>
                </div>

                {/* 남은 일정 */}
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-base font-bold tabular-nums leading-none text-foreground">
                    {data.remainingSchedules}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">
                    남은 일정
                  </span>
                </div>

                {/* 필요 출석 횟수 */}
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Target className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span
                    className={`text-base font-bold tabular-nums leading-none ${
                      data.isAchieved
                        ? "text-green-600"
                        : data.neededAttendances > data.remainingSchedules
                        ? "text-red-500"
                        : "text-foreground"
                    }`}
                  >
                    {data.isAchieved ? "0" : data.neededAttendances}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">
                    필요 출석
                  </span>
                </div>
              </div>

              {/* 전체 일정 정보 */}
              <p className="text-[10px] text-muted-foreground text-center">
                이번 달 총 {data.totalSchedules}회 일정 중 {data.attendedSchedules}회 출석
              </p>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
