"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { type MemberForecast, type TimeSlot, TIME_SLOTS } from "@/types/index";

// ────────────────────────────────────────────────────────────────────────────
// 내부 원시 데이터 타입
// ────────────────────────────────────────────────────────────────────────────

type RawScheduleRow = {
  id: string;
  starts_at: string;
};

type RawAttendanceRow = {
  schedule_id: string;
  user_id: string;
  status: string;
};

type RawMemberRow = {
  user_id: string;
  profiles: { name: string } | null;
};

// ────────────────────────────────────────────────────────────────────────────
// 집계 맵 타입
// key: `${userId}-${dayOfWeek}-${timeSlot}` (예: "abc-1-morning")
// ────────────────────────────────────────────────────────────────────────────

type AggregateEntry = {
  present: number;
  total: number;
};

// ────────────────────────────────────────────────────────────────────────────
// 시간대 판별 함수
// ────────────────────────────────────────────────────────────────────────────

function getTimeSlot(hour: number): TimeSlot {
  for (const slot of TIME_SLOTS) {
    if (slot.key === "night") {
      // 야간: 22시 이후 또는 6시 미만
      if (hour >= 22 || hour < 6) return "night";
    } else {
      if (hour >= slot.startHour && hour < slot.endHour) return slot.key;
    }
  }
  return "morning";
}

// ────────────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────────────

export function useAvailabilityForecast(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.availabilityForecast(groupId) : null,
    async () => {
      const supabase = createClient();

      // 3개월 전 기준일
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // 1) 최근 3개월 출석 체크 대상 일정 조회
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", threeMonthsAgo.toISOString())
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const schedules: RawScheduleRow[] = scheduleRows ?? [];

      if (schedules.length === 0) {
        return { aggregateMap: new Map<string, AggregateEntry>(), memberNames: new Map<string, string>(), hasData: false };
      }

      const scheduleIds = schedules.map((s) => s.id);

      // 2) 해당 일정들의 출석 기록 조회
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, user_id, status")
        .in("schedule_id", scheduleIds);

      if (attErr) throw attErr;

      const attendances: RawAttendanceRow[] = attRows ?? [];

      // 3) 그룹 멤버 + 프로필 이름 조회
      const { data: memberRows, error: memErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(name)")
        .eq("group_id", groupId);

      if (memErr) throw memErr;

      const members: RawMemberRow[] = (memberRows ?? []) as RawMemberRow[];

      // userId -> name 맵
      const memberNames = new Map<string, string>();
      for (const m of members) {
        const name = m.profiles?.name ?? "알 수 없음";
        memberNames.set(m.user_id, name);
      }

      // scheduleId -> { dayOfWeek, timeSlot } 맵
      const scheduleMetaMap = new Map<string, { dayOfWeek: number; timeSlot: TimeSlot }>();
      for (const s of schedules) {
        const date = new Date(s.starts_at);
        const dayOfWeek = date.getDay(); // 0(일) ~ 6(토)
        const hour = date.getHours();
        const timeSlot = getTimeSlot(hour);
        scheduleMetaMap.set(s.id, { dayOfWeek, timeSlot });
      }

      // 4) 집계: userId-dayOfWeek-timeSlot 조합별 출석/전체 횟수
      const aggregateMap = new Map<string, AggregateEntry>();

      for (const att of attendances) {
        const meta = scheduleMetaMap.get(att.schedule_id);
        if (!meta) continue;
        // 멤버 목록에 없는 경우 건너뜀
        if (!memberNames.has(att.user_id)) continue;

        const key = `${att.user_id}-${meta.dayOfWeek}-${meta.timeSlot}`;
        const entry = aggregateMap.get(key) ?? { present: 0, total: 0 };
        entry.total += 1;
        if (att.status === "present" || att.status === "late") {
          entry.present += 1;
        }
        aggregateMap.set(key, entry);
      }

      return { aggregateMap, memberNames, hasData: attendances.length > 0 };
    }
  );

  /**
   * 특정 요일(0=일~6=토) + 시간대 조합의 멤버별 예상 출석 확률을 반환합니다.
   * 해당 조합의 과거 기록이 없는 멤버는 전체 평균 확률을 fallback으로 사용합니다.
   */
  function getForecast(dayOfWeek: number, timeSlot: TimeSlot): MemberForecast[] {
    if (!data || !data.hasData) return [];

    const { aggregateMap, memberNames } = data;
    const results: MemberForecast[] = [];

    for (const [userId, name] of memberNames.entries()) {
      const key = `${userId}-${dayOfWeek}-${timeSlot}`;
      const entry = aggregateMap.get(key);

      if (entry && entry.total > 0) {
        const probability = Math.round((entry.present / entry.total) * 100);
        results.push({ userId, name, probability, sampleCount: entry.total });
      } else {
        // 해당 조합 기록 없음 → 전체 요일/시간대 통합 확률로 fallback
        let totalPresent = 0;
        let totalAll = 0;
        for (const [k, e] of aggregateMap.entries()) {
          if (k.startsWith(`${userId}-`)) {
            totalPresent += e.present;
            totalAll += e.total;
          }
        }
        const probability = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0;
        results.push({ userId, name, probability, sampleCount: 0 });
      }
    }

    // 확률 내림차순 정렬
    return results.sort((a, b) => b.probability - a.probability);
  }

  return {
    getForecast,
    hasData: data?.hasData ?? false,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
