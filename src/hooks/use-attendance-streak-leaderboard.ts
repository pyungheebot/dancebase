"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AttendanceStreakEntry,
  AttendanceStreakLeaderboardResult,
  StreakBadgeTier,
} from "@/types";

/** 연속 횟수에 따른 배지 등급 계산 */
function calcBadge(streak: number): StreakBadgeTier | null {
  if (streak >= 30) return "CROWN";
  if (streak >= 14) return "DIAMOND";
  if (streak >= 7) return "STAR";
  if (streak >= 3) return "FIRE";
  return null;
}

/** present 또는 late 상태를 출석으로 간주 */
function isPresent(status: string | undefined): boolean {
  return status === "present" || status === "late";
}

export function useAttendanceStreakLeaderboard(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.attendanceStreakLeaderboard(groupId) : null,
    async (): Promise<AttendanceStreakLeaderboardResult> => {
      const supabase = createClient();

      // 1. 그룹 멤버 + 프로필 조인
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", groupId);

      if (memberErr) throw memberErr;

      const members: { userId: string; name: string }[] = (memberRows ?? []).map((row: {
        user_id: string;
        profiles: { id: string; name: string } | { id: string; name: string }[] | null;
      }) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          userId: row.user_id,
          name: profile?.name ?? "알 수 없음",
        };
      });

      if (members.length === 0) {
        return { entries: [], averageStreak: 0, topEntry: null };
      }

      // 2. 출석 체크 대상 일정 전체 조회 (attendance_method != none, 시간순)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const schedules = scheduleRows ?? [];
      const scheduleIds = schedules.map((s: { id: string }) => s.id);

      if (scheduleIds.length === 0) {
        const entries: AttendanceStreakEntry[] = members.map((m, idx) => ({
          userId: m.userId,
          name: m.name,
          currentStreak: 0,
          longestStreak: 0,
          badge: null,
          rank: idx + 1,
        }));
        return { entries, averageStreak: 0, topEntry: entries[0] ?? null };
      }

      // 3. 전체 멤버의 출석 기록 한 번에 조회
      const userIds = members.map((m) => m.userId);
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, user_id, status")
        .in("schedule_id", scheduleIds)
        .in("user_id", userIds);

      if (attErr) throw attErr;

      // 4. user_id + schedule_id → status 맵 구성
      const statusMap = new Map<string, string>();
      for (const row of attRows ?? []) {
        const key = `${row.user_id}::${row.schedule_id}`;
        statusMap.set(key, row.status);
      }

      // 5. 멤버별 스트릭 계산
      const entries: Omit<AttendanceStreakEntry, "rank">[] = members.map((member) => {
        const orderedStatuses = schedules.map((s: { id: string }) =>
          isPresent(statusMap.get(`${member.userId}::${s.id}`))
        );

        // 현재 스트릭: 최근부터 역순으로 연속 출석 횟수
        let currentStreak = 0;
        for (let i = orderedStatuses.length - 1; i >= 0; i--) {
          if (orderedStatuses[i]) {
            currentStreak++;
          } else {
            break;
          }
        }

        // 최장 스트릭 계산
        let longestStreak = 0;
        let tempStreak = 0;
        for (const present of orderedStatuses) {
          if (present) {
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
          } else {
            tempStreak = 0;
          }
        }

        return {
          userId: member.userId,
          name: member.name,
          currentStreak,
          longestStreak,
          badge: calcBadge(currentStreak),
        };
      });

      // 6. 현재 스트릭 내림차순 정렬 → 순위 부여
      entries.sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        return b.longestStreak - a.longestStreak;
      });

      const ranked: AttendanceStreakEntry[] = entries.map((e, idx) => ({
        ...e,
        rank: idx + 1,
      }));

      // 7. 그룹 평균 스트릭
      const totalStreak = ranked.reduce((sum, e) => sum + e.currentStreak, 0);
      const averageStreak =
        ranked.length > 0 ? Math.round((totalStreak / ranked.length) * 10) / 10 : 0;

      return {
        entries: ranked,
        averageStreak,
        topEntry: ranked[0] ?? null,
      };
    }
  );

  return {
    entries: data?.entries ?? [],
    averageStreak: data?.averageStreak ?? 0,
    topEntry: data?.topEntry ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
