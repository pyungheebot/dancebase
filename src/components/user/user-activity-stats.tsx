"use client";

import { FileText, MessageSquare, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserActivityStats } from "@/hooks/use-user-activity-stats";

interface UserActivityStatsProps {
  userId: string;
}

export function UserActivityStats({ userId }: UserActivityStatsProps) {
  const { stats, loading } = useUserActivityStats(userId);

  const items = [
    {
      icon: FileText,
      label: "게시글",
      value: stats.postCount,
      unit: "개",
    },
    {
      icon: MessageSquare,
      label: "댓글",
      value: stats.commentCount,
      unit: "개",
    },
    {
      icon: Users,
      label: "그룹",
      value: stats.groupCount,
      unit: "개",
    },
    {
      icon: CheckCircle,
      label: "출석",
      value: stats.attendanceCount,
      unit: "회",
    },
  ];

  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          활동 통계
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map(({ icon: Icon, label, value, unit }) => (
            <div key={label} className="rounded border bg-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {label}
                </span>
              </div>
              {loading ? (
                <div className="h-6 w-10 rounded bg-muted animate-pulse" />
              ) : (
                <p className="text-lg font-bold tabular-nums leading-none">
                  {value.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">
                    {unit}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
