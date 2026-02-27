"use client";

import { useState } from "react";
import {
  Target,
  Trophy,
  ChevronDown,
  Calendar,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePersonalAttendanceGoal } from "@/hooks/use-personal-attendance-goal";

// SVG 원형 프로그레스 상수
const CIRCLE_RADIUS = 38;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

interface CircularProgressProps {
  rate: number;
  isAchieved: boolean;
}

function CircularProgress({ rate, isAchieved }: CircularProgressProps) {
  const dashOffset = CIRCLE_CIRCUMFERENCE - (Math.min(100, rate) / 100) * CIRCLE_CIRCUMFERENCE;

  const strokeColor = isAchieved
    ? "#22c55e"
    : rate >= 70
    ? "#eab308"
    : "#3b82f6";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        {/* 배경 원 */}
        <circle
          cx="48"
          cy="48"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        {/* 진행 원 */}
        <circle
          cx="48"
          cy="48"
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isAchieved ? (
          <Trophy className="h-5 w-5 text-green-500" />
        ) : (
          <>
            <span
              className="text-xl font-bold tabular-nums leading-none"
              style={{
                color: strokeColor,
              }}
            >
              {rate}
            </span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">%</span>
          </>
        )}
      </div>
    </div>
  );
}

interface GoalSetFormProps {
  defaultValue?: number;
  onSave: (count: number) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

function GoalSetForm({ defaultValue = 8, onSave, onCancel, isEdit = false }: GoalSetFormProps) {
  const [inputValue, setInputValue] = useState(String(defaultValue));

  const handleSave = () => {
    const count = parseInt(inputValue, 10);
    if (isNaN(count) || count < 1 || count > 31) return;
    onSave(count);
  };

  return (
    <div className="space-y-3 py-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Target className="h-3.5 w-3.5" />
        <span className="text-xs">
          {isEdit ? "이번 달 목표 출석 횟수를 수정하세요" : "이번 달 목표 출석 횟수를 설정하세요"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={31}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-8 text-sm w-24 tabular-nums"
          placeholder="8"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
        <span className="text-xs text-muted-foreground">회</span>
        <Button size="sm" className="h-8 text-xs ml-auto" onClick={handleSave}>
          {isEdit ? "수정" : "설정"}
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onCancel}
          >
            취소
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        1~31 사이의 숫자를 입력하세요
      </p>
    </div>
  );
}

interface PersonalAttendanceGoalCardProps {
  groupId: string;
  userId: string;
}

export function PersonalAttendanceGoalCard({
  groupId,
  userId,
}: PersonalAttendanceGoalCardProps) {
  const { data, loading, setGoal, clearGoal } = usePersonalAttendanceGoal(groupId, userId);
  const [collapsed, setCollapsed] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const hasGoal = data?.goal !== null;
  const isAchieved = data?.isAchieved ?? false;

  return (
    <Card className={isAchieved ? "border-green-200 bg-green-50/30" : ""}>
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">개인 출석 목표</span>
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
        {!loading && (
          <div className="flex flex-wrap gap-1.5 pt-2 pb-2.5">
            {hasGoal && data ? (
              <>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 gap-1"
                >
                  <Target className="h-2.5 w-2.5" />
                  목표 {data.goal!.targetCount}회
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {data.actualCount}회 출석
                </Badge>
                {isAchieved && (
                  <Badge className="text-[10px] px-1.5 py-0 gap-1 bg-green-500 text-white hover:bg-green-600">
                    <Trophy className="h-2.5 w-2.5" />
                    달성!
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                목표 미설정
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <div className="space-y-2 pt-2">
              <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            </div>
          ) : !hasGoal || showEditForm ? (
            <GoalSetForm
              defaultValue={data?.goal?.targetCount ?? 8}
              isEdit={showEditForm}
              onSave={(count) => {
                setGoal(count);
                setShowEditForm(false);
              }}
              onCancel={showEditForm ? () => setShowEditForm(false) : undefined}
            />
          ) : data ? (
            <div className="space-y-3 pt-1">
              {/* 원형 프로그레스 + 상세 정보 */}
              <div className="flex items-center gap-4">
                <CircularProgress rate={data.achievementRate} isAchieved={isAchieved} />

                <div className="flex-1 space-y-1.5">
                  {isAchieved ? (
                    <>
                      <Badge className="text-[10px] px-2 py-0.5 gap-1 bg-green-500 text-white hover:bg-green-600">
                        <Trophy className="h-2.5 w-2.5" />
                        목표 달성 완료!
                      </Badge>
                      <p className="text-[11px] text-green-600 font-medium">
                        이번 달 출석 목표를 달성했어요. 훌륭합니다!
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-foreground">
                        {data.actualCount}
                        <span className="text-muted-foreground font-normal text-[11px]">
                          {" "}/ {data.goal!.targetCount}회
                        </span>
                      </p>
                      {data.remainingCount > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          목표까지 {data.remainingCount}회 더 필요해요
                        </p>
                      )}
                      {data.dailyPaceNeeded !== null && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Flame className="h-2.5 w-2.5 text-orange-400" />
                          <span>
                            하루 {data.dailyPaceNeeded}회 페이스 필요
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* 목표 변경 / 삭제 버튼 */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-1.5 py-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowEditForm(true)}
                    >
                      목표 변경
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-1.5 py-0 text-muted-foreground hover:text-destructive"
                      onClick={() => clearGoal()}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </div>

              {/* 통계 3칸 그리드 */}
              <div className="grid grid-cols-3 gap-2">
                {/* 현재 출석 횟수 */}
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40">
                  <TrendingUp className="h-3 w-3 text-muted-foreground mb-0.5" />
                  <span
                    className={`text-base font-bold tabular-nums leading-none ${
                      isAchieved
                        ? "text-green-600"
                        : data.achievementRate >= 70
                        ? "text-yellow-600"
                        : "text-blue-500"
                    }`}
                  >
                    {data.actualCount}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">
                    현재 출석
                  </span>
                </div>

                {/* 남은 일정 */}
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40">
                  <Calendar className="h-3 w-3 text-muted-foreground mb-0.5" />
                  <span className="text-base font-bold tabular-nums leading-none text-foreground">
                    {data.remainingSchedules}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">
                    남은 일정
                  </span>
                </div>

                {/* 남은 일수 */}
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40">
                  <Flame className="h-3 w-3 text-muted-foreground mb-0.5" />
                  <span className="text-base font-bold tabular-nums leading-none text-foreground">
                    {data.remainingDays}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">
                    남은 일수
                  </span>
                </div>
              </div>

              {/* 하단 요약 */}
              <p className="text-[10px] text-muted-foreground text-center">
                이번 달 총 {data.totalSchedules}회 일정 중 {data.actualCount}회 출석
              </p>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
