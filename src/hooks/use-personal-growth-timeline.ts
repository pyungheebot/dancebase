"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { GrowthTimelineEvent, GrowthEventType } from "@/types";

// ============================================================
// 출석 마일스톤 기준 (달성 횟수 → 이벤트 제목/설명)
// ============================================================

const ATTENDANCE_MILESTONES: Array<{
  count: number;
  title: string;
  description: string;
}> = [
  { count: 1,   title: "첫 출석 달성",    description: "그룹 활동 첫 발을 내딛었습니다." },
  { count: 10,  title: "출석 10회 달성",  description: "꾸준한 참여로 10회 출석을 달성했습니다." },
  { count: 50,  title: "출석 50회 달성",  description: "인상적인 헌신으로 50회 출석을 달성했습니다." },
  { count: 100, title: "출석 100회 달성", description: "100회 출석이라는 놀라운 기록을 세웠습니다." },
];

// ============================================================
// 연속 출석 스트릭 계산 유틸리티
// ============================================================

type RawAttendanceRow = {
  status: string;
  checked_at: string;
  schedule_id: string;
  schedules: { starts_at: string } | null;
};

/**
 * 출석 이력에서 최대 연속 출석 횟수와 달성 일자를 계산합니다.
 * 출석 날짜 기준으로 연속 여부를 판단합니다.
 */
function calcStreakInfo(rows: RawAttendanceRow[]): {
  maxStreak: number;
  streakAchievedAt: string | null;
} {
  const presentRows = rows
    .filter((r) => r.status === "present" || r.status === "late")
    .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());

  if (presentRows.length === 0) {
    return { maxStreak: 0, streakAchievedAt: null };
  }

  let maxStreak = 0;
  let currentStreak = 0;
  let streakAchievedAt: string | null = null;

  for (const row of presentRows) {
    currentStreak++;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
      streakAchievedAt = row.checked_at;
    }
  }

  return { maxStreak, streakAchievedAt };
}

// ============================================================
// 훅 본체
// ============================================================

export function usePersonalGrowthTimeline(
  groupId: string,
  userId: string
): {
  events: GrowthTimelineEvent[];
  loading: boolean;
  refetch: () => void;
} {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId
      ? swrKeys.personalGrowthTimeline(groupId, userId)
      : null,
    async (): Promise<GrowthTimelineEvent[]> => {
      const supabase = createClient();
      const events: GrowthTimelineEvent[] = [];

      // ─────────────────────────────────────────────────────
      // 1) 그룹 내 출석 집계 대상 일정 목록 조회
      // ─────────────────────────────────────────────────────
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none");

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다.");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      // ─────────────────────────────────────────────────────
      // 2) 해당 멤버의 출석 기록 조회
      // ─────────────────────────────────────────────────────
      let attendanceRows: RawAttendanceRow[] = [];

      if (scheduleIds.length > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendances")
          .select("status, checked_at, schedule_id, schedules(starts_at)")
          .eq("user_id", userId)
          .in("schedule_id", scheduleIds)
          .order("checked_at", { ascending: true });

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다.");
        attendanceRows = (attRows ?? []) as RawAttendanceRow[];
      }

      // ─────────────────────────────────────────────────────
      // 3) 게시글 목록 조회
      // ─────────────────────────────────────────────────────
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("id, title, created_at")
        .eq("group_id", groupId)
        .eq("author_id", userId)
        .order("created_at", { ascending: true });

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다.");

      // ─────────────────────────────────────────────────────
      // 4) 출석 마일스톤 이벤트 생성
      // ─────────────────────────────────────────────────────
      const presentRows = attendanceRows
        .filter((r) => r.status === "present" || r.status === "late")
        .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());

      // 첫 출석 이벤트
      if (presentRows.length > 0) {
        const firstRow = presentRows[0];
        const eventType: GrowthEventType = "first_attendance";
        events.push({
          id: `first_attendance_${userId}`,
          type: eventType,
          title: "첫 출석 달성",
          description: "그룹 활동 첫 발을 내딛었습니다.",
          date: firstRow.checked_at,
          metadata: { count: 1 },
        });
      }

      // 10회, 50회, 100회 마일스톤
      for (const milestone of ATTENDANCE_MILESTONES.filter((m) => m.count > 1)) {
        if (presentRows.length >= milestone.count) {
          const targetRow = presentRows[milestone.count - 1];
          const eventType: GrowthEventType = "attendance_milestone";
          events.push({
            id: `milestone_${milestone.count}_${userId}`,
            type: eventType,
            title: milestone.title,
            description: milestone.description,
            date: targetRow.checked_at,
            metadata: { count: milestone.count },
          });
        }
      }

      // ─────────────────────────────────────────────────────
      // 5) 연속 출석 스트릭 이벤트 (최대 스트릭 5회 이상 시)
      // ─────────────────────────────────────────────────────
      const { maxStreak, streakAchievedAt } = calcStreakInfo(attendanceRows);

      if (maxStreak >= 5 && streakAchievedAt) {
        const eventType: GrowthEventType = "streak";
        events.push({
          id: `streak_${maxStreak}_${userId}`,
          type: eventType,
          title: `${maxStreak}회 연속 출석 달성`,
          description: `${maxStreak}회 연속 출석이라는 훌륭한 꾸준함을 보여줬습니다.`,
          date: streakAchievedAt,
          metadata: { streak: maxStreak },
        });
      }

      // ─────────────────────────────────────────────────────
      // 6) 게시글 작성 이벤트
      // ─────────────────────────────────────────────────────
      for (const post of (postRows ?? [])) {
        const eventType: GrowthEventType = "post";
        events.push({
          id: `post_${post.id}`,
          type: eventType,
          title: "게시글 작성",
          description: post.title ?? "게시글을 작성했습니다.",
          date: post.created_at,
          metadata: { postId: post.id },
        });
      }

      // ─────────────────────────────────────────────────────
      // 7) 전체 이벤트를 날짜 역순 정렬 후 최대 20개 반환
      // ─────────────────────────────────────────────────────
      return events
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);
    }
  );

  return {
    events: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
