"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  WeeklyHealthPoint,
  HealthMetric,
  GroupHealthTrendsResult,
} from "@/types/index";

/**
 * 최근 8주의 주 시작일(월요일) 배열을 반환합니다.
 * 인덱스 0이 가장 오래된 주, 인덱스 7이 가장 최근 주입니다.
 */
function buildWeekStarts(): Date[] {
  const now = new Date();
  // 이번 주 월요일을 기준으로 계산
  const dayOfWeek = now.getDay(); // 0=일, 1=월, ..., 6=토
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(now.getDate() - daysSinceMonday);

  const weeks: Date[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - i * 7);
    weeks.push(weekStart);
  }
  return weeks;
}

/**
 * 주 시작일로부터 해당 주의 시작/종료 ISO 문자열을 반환합니다.
 */
function weekRange(weekStart: Date): { from: string; to: string } {
  const from = new Date(weekStart);
  from.setHours(0, 0, 0, 0);
  const to = new Date(weekStart);
  to.setDate(weekStart.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * 전주 대비 변화율을 계산합니다. (현재 - 이전) / 이전 * 100
 * 이전 값이 0이면 null을 반환합니다.
 */
function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * 수치 배열에서 HealthMetric을 만듭니다.
 */
function buildMetric(trend: number[]): HealthMetric {
  const current = trend[trend.length - 1] ?? 0;
  const previous = trend[trend.length - 2] ?? 0;
  return {
    current,
    changeRate: calcChangeRate(current, previous),
    trend,
  };
}

export function useGroupHealthTrends(groupId: string): GroupHealthTrendsResult {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupHealthTrends(groupId),
    async (): Promise<Omit<GroupHealthTrendsResult, "loading" | "refetch">> => {
      const supabase = createClient();
      const weekStarts = buildWeekStarts();

      // 8주 데이터를 병렬로 집계
      const weeklyPoints = await Promise.all(
        weekStarts.map(async (weekStart, idx): Promise<WeeklyHealthPoint> => {
          const { from, to } = weekRange(weekStart);
          const label = `W${idx + 1}`;

          // 4개 집계 병렬 실행
          const [
            attendanceRes,
            postRes,
            commentRes,
            newMemberRes,
            rsvpTotalRes,
            rsvpRespondedRes,
          ] = await Promise.all([
            // 1. 해당 주 출석 데이터 (출석률 계산용)
            supabase
              .from("attendance")
              .select("status, schedule_id")
              .in(
                "schedule_id",
                (
                  await supabase
                    .from("schedules")
                    .select("id")
                    .eq("group_id", groupId)
                    .gte("starts_at", from)
                    .lte("starts_at", to)
                ).data?.map((s: { id: string }) => s.id) ?? []
              ),

            // 2. 주별 게시글 수
            supabase
              .from("board_posts")
              .select("id", { count: "exact", head: false })
              .eq("group_id", groupId)
              .gte("created_at", from)
              .lte("created_at", to),

            // 3. 주별 댓글 수
            supabase
              .from("board_comments")
              .select("id", { count: "exact", head: false })
              .eq("group_id", groupId)
              .gte("created_at", from)
              .lte("created_at", to),

            // 4. 주별 신규 멤버 수
            supabase
              .from("group_members")
              .select("id", { count: "exact", head: false })
              .eq("group_id", groupId)
              .gte("joined_at", from)
              .lte("joined_at", to),

            // 5. 해당 주 일정 수 (RSVP 분모)
            supabase
              .from("schedules")
              .select("id", { count: "exact", head: false })
              .eq("group_id", groupId)
              .gte("starts_at", from)
              .lte("starts_at", to),

            // 6. 해당 주 RSVP 응답 수 (yes + no + maybe)
            supabase
              .from("schedule_rsvp")
              .select("id", { count: "exact", head: false })
              .in(
                "schedule_id",
                (
                  await supabase
                    .from("schedules")
                    .select("id")
                    .eq("group_id", groupId)
                    .gte("starts_at", from)
                    .lte("starts_at", to)
                ).data?.map((s: { id: string }) => s.id) ?? []
              ),
          ]);

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

          // 게시판 활동 수 (게시글 + 댓글)
          const activityCount = (postRes.count ?? 0) + (commentRes.count ?? 0);

          // 신규 멤버 수
          const newMemberCount = newMemberRes.count ?? 0;

          // RSVP 응답률: 응답 수 / (일정 수 * 멤버 수) 대신
          // 실제 응답한 RSVP 수 / 일정 수 (일정당 평균 응답 수로 정규화)
          // 여기서는 응답 수 / (일정 수 * 그룹 멤버 수) 방식 사용
          // 단순화: rsvpRespondedCount / max(1, schedulesCount) 를 퍼센트로 표현
          // 더 의미있는 계산: 일정이 있을 경우에만 계산
          let rsvpRate = 0;
          const schedulesCount = rsvpTotalRes.count ?? 0;
          const rsvpRespondedCount = rsvpRespondedRes.count ?? 0;
          if (schedulesCount > 0 && rsvpRespondedCount > 0) {
            // 일정당 평균 RSVP 응답 수를 구하기 위해 그룹 멤버 수가 필요하나
            // 단순 비율: 응답 수 / (일정 수 * 예상 멤버 수)
            // 여기서는 주별 응답된 RSVP 수를 일정 수로 나눈 값을 %로 (최대 100%)
            // 실용적 접근: 응답 수 > 0이면 해당 주 RSVP 활성 지표로 사용
            // 그룹 멤버 수 기반 정규화
            const memberCountRes = await supabase
              .from("group_members")
              .select("id", { count: "exact", head: true })
              .eq("group_id", groupId);
            const memberCount = memberCountRes.count ?? 1;
            const maxPossibleRsvp = schedulesCount * memberCount;
            rsvpRate =
              maxPossibleRsvp > 0
                ? Math.min(
                    100,
                    Math.round((rsvpRespondedCount / maxPossibleRsvp) * 100)
                  )
                : 0;
          }

          return {
            label,
            weekStart: weekStart.toISOString(),
            attendanceRate,
            activityCount,
            newMemberCount,
            rsvpRate,
          };
        })
      );

      // 각 지표별 추세 배열 추출
      const attendanceTrend = weeklyPoints.map((w) => w.attendanceRate);
      const activityTrend = weeklyPoints.map((w) => w.activityCount);
      const newMemberTrend = weeklyPoints.map((w) => w.newMemberCount);
      const rsvpTrend = weeklyPoints.map((w) => w.rsvpRate);

      return {
        attendanceRate: buildMetric(attendanceTrend),
        activityCount: buildMetric(activityTrend),
        newMemberCount: buildMetric(newMemberTrend),
        rsvpRate: buildMetric(rsvpTrend),
        weeks: weeklyPoints,
      };
    }
  );

  const empty: HealthMetric = {
    current: 0,
    changeRate: null,
    trend: Array(8).fill(0),
  };

  return {
    attendanceRate: data?.attendanceRate ?? empty,
    activityCount: data?.activityCount ?? empty,
    newMemberCount: data?.newMemberCount ?? empty,
    rsvpRate: data?.rsvpRate ?? empty,
    weeks: data?.weeks ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
