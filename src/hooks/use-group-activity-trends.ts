"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MonthlyActivityTrend,
  ActivityTrendChange,
  GroupActivityTrendsResult,
} from "@/types/index";

/**
 * 최근 6개월 YYYY-MM 문자열 배열을 반환합니다.
 */
function buildMonths(): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(ym);
  }
  return months;
}

/**
 * YYYY-MM 문자열로부터 해당 월의 시작/종료 ISO 문자열을 반환합니다.
 */
function monthRange(ym: string): { from: string; to: string } {
  const [year, month] = ym.split("-").map(Number);
  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  return { from, to };
}

/**
 * 전월 대비 변화율을 계산합니다. (현재 - 이전) / 이전 * 100
 * 이전 값이 0이면 null을 반환합니다.
 */
function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function useGroupActivityTrends(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupActivityTrends(groupId),
    async (): Promise<GroupActivityTrendsResult> => {
      const supabase = createClient();
      const months = buildMonths();

      // 월별 데이터를 병렬로 집계
      const monthlyData = await Promise.all(
        months.map(async (ym): Promise<MonthlyActivityTrend> => {
          const { from, to } = monthRange(ym);
          const monthNum = parseInt(ym.split("-")[1]);
          const label = `${monthNum}월`;

          // 4개 쿼리 병렬 실행
          const [scheduleRes, attendanceRes, postRes, commentRes] = await Promise.all(
            [
              // 1. 월별 일정 수
              supabase
                .from("schedules")
                .select("id", { count: "exact", head: false })
                .eq("group_id", groupId)
                .gte("starts_at", from)
                .lte("starts_at", to),

              // 2. 월별 출석 데이터 (출석률 계산용)
              supabase
                .from("attendance")
                .select("status, schedule_id")
                .in(
                  "schedule_id",
                  // 해당 월 일정 ID 목록을 서브쿼리 대신 별도 조회
                  (
                    await supabase
                      .from("schedules")
                      .select("id")
                      .eq("group_id", groupId)
                      .gte("starts_at", from)
                      .lte("starts_at", to)
                  ).data?.map((s: { id: string }) => s.id) ?? []
                ),

              // 3. 월별 게시글 수
              supabase
                .from("board_posts")
                .select("id", { count: "exact", head: false })
                .eq("group_id", groupId)
                .gte("created_at", from)
                .lte("created_at", to),

              // 4. 월별 댓글 수
              supabase
                .from("board_comments")
                .select("id", { count: "exact", head: false })
                .eq("group_id", groupId)
                .gte("created_at", from)
                .lte("created_at", to),
            ]
          );

          // 일정 수
          const scheduleCount = scheduleRes.count ?? 0;

          // 출석률 계산 (present + late / 전체)
          let attendanceRate = 0;
          if (attendanceRes.data && attendanceRes.data.length > 0) {
            const total = attendanceRes.data.length;
            const attended = attendanceRes.data.filter(
              (row: { status: string }) =>
                row.status === "present" || row.status === "late"
            ).length;
            attendanceRate = Math.round((attended / total) * 100);
          }

          // 게시글 수
          const postCount = postRes.count ?? 0;

          // 댓글 수
          const commentCount = commentRes.count ?? 0;

          return {
            month: ym,
            label,
            scheduleCount,
            attendanceRate,
            postCount,
            commentCount,
          };
        })
      );

      // 전월 대비 변화율 (마지막 월 vs 그 이전 월)
      const current = monthlyData[monthlyData.length - 1];
      const previous = monthlyData[monthlyData.length - 2];

      const change: ActivityTrendChange = {
        scheduleChange: calcChange(current.scheduleCount, previous.scheduleCount),
        attendanceChange: calcChange(current.attendanceRate, previous.attendanceRate),
        postChange: calcChange(current.postCount, previous.postCount),
        commentChange: calcChange(current.commentCount, previous.commentCount),
      };

      return {
        monthly: monthlyData,
        change,
      };
    }
  );

  return {
    monthly: data?.monthly ?? [],
    change: data?.change ?? {
      scheduleChange: null,
      attendanceChange: null,
      postChange: null,
      commentChange: null,
    },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
