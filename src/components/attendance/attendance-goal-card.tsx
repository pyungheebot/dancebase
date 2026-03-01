"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { useAttendanceGoal } from "@/hooks/use-attendance-goals";
import { invalidateAttendanceGoal } from "@/lib/swr/invalidate";
import { useAsyncAction } from "@/hooks/use-async-action";

type AttendanceGoalCardProps = {
  groupId: string;
  canEdit: boolean;
};

// 원형 진행률 SVG 컴포넌트
function CircularProgress({
  rate,
  targetRate,
  size = 80,
}: {
  rate: number;
  targetRate: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  // 목표 달성 여부에 따른 색상 결정
  const isAchieved = rate >= targetRate;
  const strokeColor = isAchieved
    ? "#22c55e"
    : rate >= targetRate * 0.8
    ? "#eab308"
    : "#ef4444";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* 배경 트랙 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={8}
      />
      {/* 목표선 (얇은 마커) */}
      {(() => {
        const targetOffset =
          circumference - (targetRate / 100) * circumference;
        return (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={3}
            strokeDasharray={`2 ${circumference - 2}`}
            strokeDashoffset={targetOffset}
            strokeLinecap="round"
          />
        );
      })()}
      {/* 진행 바 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={8}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function AttendanceGoalCard({ groupId, canEdit }: AttendanceGoalCardProps) {
  const { data, loading, refetch } = useAttendanceGoal(groupId);
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [targetRateInput, setTargetRateInput] = useState("");
  const [periodInput, setPeriodInput] = useState<"monthly" | "quarterly">("monthly");
  const { pending: saving, execute } = useAsyncAction();

  const supabase = createClient();

  // 편집 모드 진입 시 현재 값으로 초기화
  const handleEditOpen = () => {
    setTargetRateInput(String(data?.goal?.target_rate ?? 80));
    setPeriodInput(data?.goal?.period ?? "monthly");
    setEditMode(true);
  };

  const handleSave = async () => {
    const rate = parseInt(targetRateInput, 10);
    if (isNaN(rate) || rate < 1 || rate > 100) {
      toast.error(TOAST.ATTENDANCE.GOAL_RANGE);
      return;
    }

    await execute(async () => {
      if (!user) {
        toast.error(TOAST.LOGIN_REQUIRED);
        return;
      }

      if (data?.goal) {
        // 업데이트
        const { error } = await supabase
          .from("attendance_goals")
          .update({ target_rate: rate, period: periodInput })
          .eq("group_id", groupId);
        if (error) {
          toast.error(TOAST.ATTENDANCE.GOAL_SAVE_ERROR);
          return;
        }
      } else {
        // 신규 생성
        const { error } = await supabase.from("attendance_goals").insert({
          group_id: groupId,
          target_rate: rate,
          period: periodInput,
          created_by: user.id,
        });
        if (error) {
          toast.error(TOAST.ATTENDANCE.GOAL_SAVE_ERROR);
          return;
        }
      }

      toast.success(TOAST.ATTENDANCE.GOAL_SAVED);
      setEditMode(false);
      invalidateAttendanceGoal(groupId);
      refetch();
    });
  };

  const handleDelete = async () => {
    if (!data?.goal) return;
    await execute(async () => {
      const { error } = await supabase
        .from("attendance_goals")
        .delete()
        .eq("group_id", groupId);
      if (error) {
        toast.error(TOAST.ATTENDANCE.GOAL_DELETE_ERROR);
        return;
      }
      toast.success(TOAST.ATTENDANCE.GOAL_DELETED);
      setEditMode(false);
      invalidateAttendanceGoal(groupId);
      refetch();
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // 목표가 없고 편집 권한도 없으면 렌더링 안 함
  if (!data?.goal && !canEdit) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-muted-foreground" />
            출석 목표
          </CardTitle>
          {canEdit && !editMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleEditOpen}
            >
              {data?.goal ? "수정" : "목표 설정"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {/* 편집 모드 */}
        {editMode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  목표 출석률 (%)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={targetRateInput}
                  onChange={(e) => setTargetRateInput(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="80"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  기간
                </label>
                <Select
                  value={periodInput}
                  onValueChange={(v) =>
                    setPeriodInput(v as "monthly" | "quarterly")
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">월간</SelectItem>
                    <SelectItem value="quarterly">분기별</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              {data?.goal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  disabled={saving}
                  onClick={handleDelete}
                >
                  삭제
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={saving}
                onClick={() => setEditMode(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                저장
              </Button>
            </div>
          </div>
        ) : data?.goal ? (
          /* 진행 현황 표시 */
          <div className="flex items-center gap-4">
            {/* 원형 진행률 */}
            <div className="relative shrink-0">
              <CircularProgress
                rate={data.currentRate}
                targetRate={data.goal.target_rate}
                size={80}
              />
              {/* 중앙 텍스트 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-base font-bold tabular-nums leading-tight ${
                    data.currentRate >= data.goal.target_rate
                      ? "text-green-600"
                      : data.currentRate >= data.goal.target_rate * 0.8
                      ? "text-yellow-600"
                      : "text-red-500"
                  }`}
                >
                  {data.currentRate}%
                </span>
              </div>
            </div>

            {/* 텍스트 정보 */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {data.periodLabel} 목표
                </span>
                <span className="text-sm font-semibold">
                  {data.goal.target_rate}%
                </span>
                {data.currentRate >= data.goal.target_rate ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                    목표 달성!
                  </Badge>
                ) : null}
              </div>

              {/* 진행 바 */}
              <div className="space-y-0.5">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.currentRate >= data.goal.target_rate
                        ? "bg-green-500"
                        : data.currentRate >= data.goal.target_rate * 0.8
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, data.currentRate)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {data.presentCount}/{data.totalSchedules}회 출석
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    목표 {data.goal.target_rate}%
                  </span>
                </div>
              </div>

              {/* 안내 메시지 */}
              {data.totalSchedules === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  {data.periodLabel} 아직 일정이 없습니다
                </p>
              ) : data.currentRate >= data.goal.target_rate ? (
                <p className="text-[11px] text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  훌륭해요! 목표를 달성했습니다
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  목표 달성까지 {data.remainingForGoal}회 더 출석해야 합니다
                </p>
              )}
            </div>
          </div>
        ) : (
          /* 목표 미설정 상태 (리더만 볼 수 있음) */
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              아직 출석 목표가 설정되지 않았습니다
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              위의 &apos;목표 설정&apos; 버튼을 눌러 목표를 설정해보세요
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
