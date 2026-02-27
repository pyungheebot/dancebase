"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ActivityHeatmapData, HeatmapCell } from "@/types";

// 히트맵에서 사용할 시간대 슬롯 (2시간 단위, 6시~24시)
// hourSlot: 시작 시각 (6, 8, 10, 12, 14, 16, 18, 20, 22) => 9개 슬롯
const HOUR_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

// 요일: 0=월 ~ 6=일 (JS Date.getDay()는 0=일 이므로 변환 필요)
// JS: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
// 우리: 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
function jsToOurDay(jsDay: number): number {
  // 0(일) -> 6, 1(월) -> 0, ..., 6(토) -> 5
  return jsDay === 0 ? 6 : jsDay - 1;
}

// 시각(hour)이 속하는 슬롯의 시작 시각 반환
// 예: 7 -> 6, 9 -> 8, 23 -> 22
function hourToSlot(hour: number): number | null {
  for (let i = HOUR_SLOTS.length - 1; i >= 0; i--) {
    if (hour >= HOUR_SLOTS[i]) return HOUR_SLOTS[i];
  }
  return null; // 6시 미만은 슬롯 없음
}

export function useGroupActivityHeatmap(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupActivityHeatmap(groupId) : null,
    async (): Promise<ActivityHeatmapData> => {
      const supabase = createClient();

      // 최근 90일 범위 계산
      const now = new Date();
      const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();

      // schedules 조회 (출석 방식이 none이 아닌 것만)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", from)
        .lte("starts_at", to);

      if (schedErr) {
        throw new Error("일정 데이터를 불러오지 못했습니다");
      }

      const schedules = (scheduleRows ?? []) as { id: string; starts_at: string }[];

      if (schedules.length === 0) {
        return { cells: [], bestSlots: [] };
      }

      const scheduleIds = schedules.map((s) => s.id);

      // attendance 조회
      const { data: attendanceRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, status")
        .in("schedule_id", scheduleIds);

      if (attErr) {
        throw new Error("출석 데이터를 불러오지 못했습니다");
      }

      const attendance = (attendanceRows ?? []) as { schedule_id: string; status: string }[];

      // scheduleId -> { dayIndex, hourSlot } 매핑
      type SlotKey = string; // `${dayIndex}-${hourSlot}`
      const scheduleToSlot = new Map<string, { dayIndex: number; hourSlot: number }>();

      for (const s of schedules) {
        const d = new Date(s.starts_at);
        const dayIndex = jsToOurDay(d.getDay());
        const slot = hourToSlot(d.getHours());
        if (slot === null) continue; // 6시 미만 일정은 히트맵 제외
        scheduleToSlot.set(s.id, { dayIndex, hourSlot: slot });
      }

      // 슬롯별 집계
      const slotScheduleCount = new Map<SlotKey, Set<string>>(); // scheduleId set
      const slotAttendanceCount = new Map<SlotKey, number>();

      for (const [schedId, { dayIndex, hourSlot }] of scheduleToSlot.entries()) {
        const key: SlotKey = `${dayIndex}-${hourSlot}`;
        if (!slotScheduleCount.has(key)) slotScheduleCount.set(key, new Set());
        slotScheduleCount.get(key)!.add(schedId);
      }

      for (const att of attendance) {
        const slot = scheduleToSlot.get(att.schedule_id);
        if (!slot) continue;
        if (att.status === "present" || att.status === "late") {
          const key: SlotKey = `${slot.dayIndex}-${slot.hourSlot}`;
          slotAttendanceCount.set(key, (slotAttendanceCount.get(key) ?? 0) + 1);
        }
      }

      // HeatmapCell 배열 생성 (데이터가 있는 슬롯만)
      const cells: HeatmapCell[] = [];

      for (const [key, schedSet] of slotScheduleCount.entries()) {
        const [dayStr, hourStr] = key.split("-");
        const dayIndex = Number(dayStr);
        const hourSlot = Number(hourStr);
        const scheduleCount = schedSet.size;
        const attendanceCount = slotAttendanceCount.get(key) ?? 0;

        // 출석 가능한 총 슬롯 수 = 스케줄 수 * 멤버 수로 나눠야 정확하지만
        // 멤버별 데이터가 없으므로 전체 attendance 레코드 수 / scheduleCount 로 추정
        // 여기서는 슬롯의 attendance 레코드 수 / scheduleCount를 평균 출석 수로 사용
        const avgAttendanceRate =
          scheduleCount > 0
            ? Math.min(100, Math.round((attendanceCount / scheduleCount) * 100) / 100)
            : 0;

        cells.push({
          dayIndex,
          hourSlot,
          attendanceCount,
          scheduleCount,
          avgAttendanceRate,
        });
      }

      // 상위 3개 최적 시간대 추천 (scheduleCount >= 1, avgAttendanceRate 내림차순)
      const sorted = [...cells]
        .filter((c) => c.scheduleCount >= 1)
        .sort((a, b) => b.avgAttendanceRate - a.avgAttendanceRate || b.scheduleCount - a.scheduleCount);

      const bestSlots = sorted.slice(0, 3).map((c) => ({
        dayIndex: c.dayIndex,
        hourSlot: c.hourSlot,
        rate: c.avgAttendanceRate,
      }));

      return { cells, bestSlots };
    }
  );

  return {
    heatmap: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
