"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { AttendanceAchievement } from "@/types";

/**
 * 배지 달성 조건 정의
 */
const BADGE_DEFINITIONS: Array<{
  id: AttendanceAchievement["id"];
  emoji: string;
  label: string;
  description: string;
  required: number;
  type: "count" | "streak" | "rate";
}> = [
  {
    id: "first_attendance",
    emoji: "🌟",
    label: "첫 출석",
    description: "첫 번째 출석을 달성했습니다",
    required: 1,
    type: "count",
  },
  {
    id: "attendance_10",
    emoji: "🔥",
    label: "10회 출석",
    description: "누적 출석 10회를 달성했습니다",
    required: 10,
    type: "count",
  },
  {
    id: "attendance_50",
    emoji: "💎",
    label: "50회 출석",
    description: "누적 출석 50회를 달성했습니다",
    required: 50,
    type: "count",
  },
  {
    id: "attendance_100",
    emoji: "👑",
    label: "100회 출석",
    description: "누적 출석 100회를 달성했습니다",
    required: 100,
    type: "count",
  },
  {
    id: "perfect_streak",
    emoji: "🎯",
    label: "개근상",
    description: "연속 10회 출석을 달성했습니다",
    required: 10,
    type: "streak",
  },
  {
    id: "attendance_king",
    emoji: "⚡",
    label: "출석왕",
    description: "그룹 출석률 90% 이상을 달성했습니다",
    required: 90,
    type: "rate",
  },
];

export type RawAttendanceRow = {
  schedule_id: string;
  status: string;
  checked_at: string;
};

/**
 * 출석 상태 배열로 최대 연속 출석 횟수 계산
 * checked_at 기준 오름차순 정렬 후 연속 present/late 카운트
 */
export function calcMaxStreak(rows: RawAttendanceRow[]): number {
  if (rows.length === 0) return 0;

  // 날짜 오름차순 정렬
  const sorted = [...rows].sort(
    (a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
  );

  let maxStreak = 0;
  let currentStreak = 0;

  for (const row of sorted) {
    if (row.status === "present" || row.status === "late") {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * 특정 멤버의 출석 달성 배지 목록을 계산하는 훅.
 *
 * - groupId 내 해당 userId의 출석 데이터를 SWR로 캐시합니다.
 * - DB 변경 없이 attendances 테이블 집계만 사용합니다.
 *
 * @param groupId - 그룹 ID
 * @param userId  - 사용자 ID
 */
export function useAttendanceAchievements(
  groupId: string,
  userId: string
): {
  achievements: AttendanceAchievement[];
  loading: boolean;
  totalCount: number;
  achievedCount: number;
} {
  const { data, isLoading } = useSWR(
    groupId && userId
      ? swrKeys.attendanceAchievements(groupId, userId)
      : null,
    async () => {
      const supabase = createClient();

      // 1) 그룹 내 출석 집계 대상 일정 목록 조회
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none");

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);
      const totalSchedules = scheduleIds.length;

      if (scheduleIds.length === 0) {
        return { attendanceRows: [] as RawAttendanceRow[], totalSchedules: 0 };
      }

      // 2) 해당 멤버의 출석 기록 조회 (checked_at 포함)
      const { data: attRows, error: attErr } = await supabase
        .from("attendances")
        .select("schedule_id, status, checked_at")
        .eq("user_id", userId)
        .in("schedule_id", scheduleIds);

      if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

      return {
        attendanceRows: (attRows ?? []) as RawAttendanceRow[],
        totalSchedules,
      };
    }
  );

  if (!data) {
    return {
      achievements: BADGE_DEFINITIONS.map((def) => ({
        id: def.id,
        emoji: def.emoji,
        label: def.label,
        description: def.description,
        achieved: false,
        progress:
          def.type === "rate" ? `0/${def.required}%` : `0/${def.required}회`,
        current: 0,
        required: def.required,
      })),
      loading: isLoading,
      totalCount: BADGE_DEFINITIONS.length,
      achievedCount: 0,
    };
  }

  const { attendanceRows, totalSchedules } = data;

  // 누적 출석 수 (present + late)
  const presentRows = attendanceRows.filter(
    (r) => r.status === "present" || r.status === "late"
  );
  const totalAttended = presentRows.length;

  // 최대 연속 출석 횟수
  const maxStreak = calcMaxStreak(attendanceRows);

  // 출석률 (%)
  const attendanceRate =
    totalSchedules > 0
      ? Math.round((totalAttended / totalSchedules) * 100)
      : 0;

  const achievements: AttendanceAchievement[] = BADGE_DEFINITIONS.map((def) => {
    let current = 0;
    let achieved = false;
    let progress = "";

    if (def.type === "count") {
      current = totalAttended;
      achieved = current >= def.required;
      progress = `${current}/${def.required}회 출석`;
    } else if (def.type === "streak") {
      current = maxStreak;
      achieved = current >= def.required;
      progress = `최대 연속 ${current}/${def.required}회`;
    } else {
      // rate
      current = attendanceRate;
      achieved = current >= def.required;
      progress = `출석률 ${current}/${def.required}%`;
    }

    return {
      id: def.id,
      emoji: def.emoji,
      label: def.label,
      description: def.description,
      achieved,
      progress,
      current,
      required: def.required,
    };
  });

  const achievedCount = achievements.filter((a) => a.achieved).length;

  return {
    achievements,
    loading: isLoading,
    totalCount: BADGE_DEFINITIONS.length,
    achievedCount,
  };
}
