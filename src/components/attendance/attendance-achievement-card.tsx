"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Trophy } from "lucide-react";
import { useAttendanceAchievements } from "@/hooks/use-attendance-achievements";
import { cn } from "@/lib/utils";

type AttendanceAchievementCardProps = {
  groupId: string;
  userId: string;
};

/**
 * 특정 멤버의 출석 달성 배지 목록을 카드 형태로 표시합니다.
 *
 * - 달성한 배지: 밝은 배경 + 이모지 강조 + 진행도
 * - 미달성 배지: 회색 처리 + 잠금 아이콘
 */
export function AttendanceAchievementCard({
  groupId,
  userId,
}: AttendanceAchievementCardProps) {
  const { achievements, loading, totalCount, achievedCount } =
    useAttendanceAchievements(groupId, userId);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            출석 달성 배지
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            출석 달성 배지
          </CardTitle>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 tabular-nums"
          >
            {achievedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "relative rounded-lg border p-2.5 transition-colors",
                achievement.achieved
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                  : "bg-muted/40 border-muted"
              )}
            >
              {/* 미달성 잠금 아이콘 */}
              {!achievement.achieved && (
                <Lock className="absolute top-2 right-2 h-3 w-3 text-muted-foreground/50" />
              )}

              {/* 이모지 + 배지명 */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={cn(
                    "text-base leading-none",
                    !achievement.achieved && "grayscale opacity-40"
                  )}
                >
                  {achievement.emoji}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    achievement.achieved
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-muted-foreground"
                  )}
                >
                  {achievement.label}
                </span>
              </div>

              {/* 달성 조건 설명 */}
              <p
                className={cn(
                  "text-[10px] leading-tight mb-1.5",
                  achievement.achieved
                    ? "text-amber-700/80 dark:text-amber-400/80"
                    : "text-muted-foreground/70"
                )}
              >
                {achievement.description}
              </p>

              {/* 진행도 */}
              <div className="space-y-1">
                {/* 진행 바 */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      achievement.achieved ? "bg-amber-500" : "bg-muted-foreground/30"
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        (achievement.current / achievement.required) * 100
                      )}%`,
                    }}
                  />
                </div>
                {/* 진행 텍스트 */}
                <p
                  className={cn(
                    "text-[10px] tabular-nums leading-none",
                    achievement.achieved
                      ? "text-amber-700 dark:text-amber-400 font-medium"
                      : "text-muted-foreground/60"
                  )}
                >
                  {achievement.progress}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
