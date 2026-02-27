"use client";

import { Flame, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendanceStreak } from "@/hooks/use-attendance-streak";

type AttendanceStreakCardProps = {
  groupId: string;
  userId: string;
};

export function AttendanceStreakCard({ groupId, userId }: AttendanceStreakCardProps) {
  const { currentStreak, longestStreak, monthlyRate, totalPresent, loading } =
    useAttendanceStreak(groupId, userId);

  const isHighStreak = currentStreak >= 10;
  const isMediumStreak = currentStreak >= 5 && currentStreak < 10;

  return (
    <Card
      className={
        isHighStreak
          ? "bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-200"
          : isMediumStreak
          ? "border-amber-200"
          : ""
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Flame
            className={`h-4 w-4 ${
              currentStreak >= 5 ? "text-amber-500" : "text-muted-foreground"
            }`}
          />
          나의 출석 스트릭
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {/* 현재 스트릭 */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60">
              <div className="flex items-center gap-1">
                <Flame
                  className={`h-3.5 w-3.5 ${
                    currentStreak >= 5 ? "text-amber-500" : "text-muted-foreground"
                  }`}
                />
                <span className="text-[10px] text-muted-foreground font-medium">현재 스트릭</span>
              </div>
              <span
                className={`text-2xl font-bold tabular-nums leading-none ${
                  currentStreak >= 10
                    ? "text-amber-600"
                    : currentStreak >= 5
                    ? "text-amber-500"
                    : "text-foreground"
                }`}
              >
                {currentStreak}
              </span>
              <span className="text-[10px] text-muted-foreground">회 연속</span>
            </div>

            {/* 최장 스트릭 */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60">
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">최장 스트릭</span>
              </div>
              <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
                {longestStreak}
              </span>
              <span className="text-[10px] text-muted-foreground">회</span>
            </div>

            {/* 이번 달 출석률 */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">이번 달</span>
              </div>
              <span
                className={`text-2xl font-bold tabular-nums leading-none ${
                  monthlyRate >= 80
                    ? "text-green-600"
                    : monthlyRate >= 50
                    ? "text-yellow-600"
                    : "text-red-500"
                }`}
              >
                {monthlyRate}
              </span>
              <span className="text-[10px] text-muted-foreground">%</span>
            </div>
          </div>
        )}

        {!loading && totalPresent > 0 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            누적 출석 {totalPresent}회
          </p>
        )}
      </CardContent>
    </Card>
  );
}
