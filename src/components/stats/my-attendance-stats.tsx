"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

// ─── 타입 ─────────────────────────────────────────────────────────────────────
type GroupStats = {
  group_id: string;
  group_name: string;
  total_schedules: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  early_leave_count: number;
  attendance_rate: number;
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export function MyAttendanceStats() {
  const supabase = createClient();
  const [stats, setStats] = useState<GroupStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.rpc("get_user_attendance_stats", {
      p_user_id: user.id,
    });

    if (data) {
      const groupStats: GroupStats[] = data.map(
        (row: {
          group_id: string;
          group_name: string;
          total_schedules: number;
          present_count: number;
          late_count: number;
          absent_count: number;
          early_leave_count: number;
        }) => {
          const total = Number(row.total_schedules);
          const present = Number(row.present_count);
          const late = Number(row.late_count);
          const absent = Number(row.absent_count);
          const earlyLeave = Number(row.early_leave_count);
          const rate =
            total > 0
              ? Math.round(((present + late + earlyLeave) / total) * 100)
              : 0;
          return {
            group_id: row.group_id,
            group_name: row.group_name,
            total_schedules: total,
            present_count: present,
            late_count: late,
            absent_count: absent,
            early_leave_count: earlyLeave,
            attendance_rate: rate,
          };
        }
      );
      setStats(groupStats);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    startTransition(() => {
      fetchStats();
    });
  }, [fetchStats]);

  // 전체 집계
  const overallPresent = stats.reduce((sum, s) => sum + s.present_count, 0);
  const overallLate = stats.reduce((sum, s) => sum + s.late_count, 0);
  const overallEarlyLeave = stats.reduce(
    (sum, s) => sum + s.early_leave_count,
    0
  );
  const overallTotal = stats.reduce((sum, s) => sum + s.total_schedules, 0);
  const overallRate =
    overallTotal > 0
      ? Math.round(
          ((overallPresent + overallLate + overallEarlyLeave) / overallTotal) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground py-8">
        출석 기록이 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 전체 요약 — 인라인 */}
      <div className="flex items-center gap-4 text-xs border rounded px-3 py-2">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          전체{" "}
          <span className="font-semibold tabular-nums">{overallRate}%</span>
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          출석{" "}
          <span className="font-semibold tabular-nums">{overallPresent}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500" />
          지각{" "}
          <span className="font-semibold tabular-nums">{overallLate}</span>
        </span>
        <span className="flex items-center gap-1">
          조퇴{" "}
          <span className="font-semibold tabular-nums">{overallEarlyLeave}</span>
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-red-500" />
          결석{" "}
          <span className="font-semibold tabular-nums">
            {overallTotal - overallPresent - overallLate - overallEarlyLeave}
          </span>
        </span>
      </div>

      {/* 그룹별 통계 */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground mb-2">
          그룹별
        </h2>
        <div className="space-y-1">
          {stats.map((stat) => (
            <div key={stat.group_id} className="rounded border px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">{stat.group_name}</span>
                <span className="text-xs font-semibold tabular-nums">
                  {stat.attendance_rate}%
                </span>
              </div>
              <div className="flex gap-4 text-[11px] text-muted-foreground mb-1.5">
                <span>전체 {stat.total_schedules}회</span>
                <span className="text-green-600">출석 {stat.present_count}</span>
                <span className="text-yellow-600">지각 {stat.late_count}</span>
                <span className="text-orange-600">
                  조퇴 {stat.early_leave_count}
                </span>
                <span className="text-red-600">결석 {stat.absent_count}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${stat.attendance_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
