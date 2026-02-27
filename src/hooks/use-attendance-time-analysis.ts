"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AttendanceTimeAnalysisResult,
  AttendanceTimeSlot,
  AttendanceTimeSlotStat,
  AttendanceDayOfWeekStat,
  AttendanceTimeSlotDayStat,
} from "@/types";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const TIME_SLOT_META: {
  slot: AttendanceTimeSlot;
  label: string;
  range: string;
  startHour: number;
  endHour: number;
}[] = [
  { slot: "morning", label: "오전", range: "06~12시", startHour: 6, endHour: 12 },
  { slot: "afternoon", label: "오후", range: "12~18시", startHour: 12, endHour: 18 },
  { slot: "evening", label: "저녁", range: "18~24시", startHour: 18, endHour: 24 },
];

function getTimeSlot(isoDate: string): AttendanceTimeSlot | null {
  const hour = new Date(isoDate).getHours();
  for (const meta of TIME_SLOT_META) {
    if (hour >= meta.startHour && hour < meta.endHour) {
      return meta.slot;
    }
  }
  // 자정~06시는 저녁(전날 밤)으로 처리하지 않고 null 반환
  return null;
}

// JS getDay(): 0=일, 1=월 ... 6=토 → 우리 인덱스: 0=월 ... 6=일
function getDayIndex(isoDate: string): number {
  const jsDay = new Date(isoDate).getDay(); // 0=일
  return jsDay === 0 ? 6 : jsDay - 1;
}

async function fetchAttendanceTimeAnalysis(
  groupId: string,
  period: "last30days" | "all"
): Promise<AttendanceTimeAnalysisResult> {
  const supabase = createClient();

  // 기간 필터 설정
  let dateFilter: string | null = null;
  if (period === "last30days") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    dateFilter = d.toISOString();
  }

  // 일정 조회
  let schedulesQuery = supabase
    .from("schedules")
    .select("id, starts_at")
    .eq("group_id", groupId);

  if (dateFilter) {
    schedulesQuery = schedulesQuery.gte("starts_at", dateFilter);
  }

  const { data: schedules, error: schedulesError } = await schedulesQuery;
  if (schedulesError) throw new Error(schedulesError.message);
  if (!schedules || schedules.length === 0) {
    return buildEmptyResult(period);
  }

  const scheduleIds = schedules.map((s: { id: string; starts_at: string }) => s.id);

  // 출석 데이터 조회
  const { data: attendances, error: attendanceError } = await supabase
    .from("attendance")
    .select("schedule_id, status")
    .in("schedule_id", scheduleIds);

  if (attendanceError) throw new Error(attendanceError.message);

  // scheduleId → starts_at 맵
  const scheduleMap = new Map<string, string>(
    schedules.map((s: { id: string; starts_at: string }) => [s.id, s.starts_at])
  );

  // ---- 시간대별 집계 ----
  type SlotAccum = { scheduleIds: Set<string>; present: number; total: number };
  const slotAccum = new Map<AttendanceTimeSlot, SlotAccum>(
    TIME_SLOT_META.map((m) => [
      m.slot,
      { scheduleIds: new Set(), present: 0, total: 0 },
    ])
  );

  // ---- 요일별 집계 ----
  type DayAccum = { scheduleIds: Set<string>; present: number; total: number };
  const dayAccum: DayAccum[] = Array.from({ length: 7 }, () => ({
    scheduleIds: new Set(),
    present: 0,
    total: 0,
  }));

  // ---- 시간대+요일 조합 집계 ----
  type CombKey = string; // `${slot}:${dayIndex}`
  const combAccum = new Map<CombKey, { present: number; total: number; scheduleIds: Set<string> }>();

  for (const att of attendances ?? []) {
    const startsAt = scheduleMap.get(att.schedule_id);
    if (!startsAt) continue;

    const slot = getTimeSlot(startsAt);
    const dayIndex = getDayIndex(startsAt);
    const isPresent =
      att.status === "present" || att.status === "late";

    // 시간대 집계
    if (slot) {
      const sa = slotAccum.get(slot)!;
      sa.scheduleIds.add(att.schedule_id);
      sa.total += 1;
      if (isPresent) sa.present += 1;
    }

    // 요일 집계
    const da = dayAccum[dayIndex];
    da.scheduleIds.add(att.schedule_id);
    da.total += 1;
    if (isPresent) da.present += 1;

    // 조합 집계
    if (slot) {
      const combKey: CombKey = `${slot}:${dayIndex}`;
      if (!combAccum.has(combKey)) {
        combAccum.set(combKey, { present: 0, total: 0, scheduleIds: new Set() });
      }
      const ca = combAccum.get(combKey)!;
      ca.scheduleIds.add(att.schedule_id);
      ca.total += 1;
      if (isPresent) ca.present += 1;
    }
  }

  // ---- 결과 변환 ----
  const timeSlots: AttendanceTimeSlotStat[] = TIME_SLOT_META.map((meta) => {
    const acc = slotAccum.get(meta.slot)!;
    return {
      slot: meta.slot,
      label: meta.label,
      range: meta.range,
      scheduleCount: acc.scheduleIds.size,
      presentCount: acc.present,
      totalCount: acc.total,
      rate: acc.total > 0 ? Math.round((acc.present / acc.total) * 100) : 0,
    };
  });

  const daysOfWeek: AttendanceDayOfWeekStat[] = dayAccum.map((acc, i) => ({
    dayIndex: i,
    dayLabel: DAY_LABELS[i],
    scheduleCount: acc.scheduleIds.size,
    presentCount: acc.present,
    totalCount: acc.total,
    rate: acc.total > 0 ? Math.round((acc.present / acc.total) * 100) : 0,
  }));

  const slotDayCombinations: AttendanceTimeSlotDayStat[] = [];
  combAccum.forEach((acc, key) => {
    const [slot, dayStr] = key.split(":") as [AttendanceTimeSlot, string];
    slotDayCombinations.push({
      slot,
      dayIndex: Number(dayStr),
      rate: acc.total > 0 ? Math.round((acc.present / acc.total) * 100) : 0,
      scheduleCount: acc.scheduleIds.size,
    });
  });

  // ---- 최적 추천 ----
  const bestSlotStat = timeSlots
    .filter((s) => s.scheduleCount > 0)
    .sort((a, b) => b.rate - a.rate)[0] ?? null;

  const bestDayStat = daysOfWeek
    .filter((d) => d.scheduleCount > 0)
    .sort((a, b) => b.rate - a.rate)[0] ?? null;

  const bestCombStat = slotDayCombinations
    .filter((c) => c.scheduleCount > 0)
    .sort((a, b) => b.rate - a.rate)[0] ?? null;

  return {
    timeSlots,
    daysOfWeek,
    slotDayCombinations,
    bestSlot: bestSlotStat?.slot ?? null,
    bestDay: bestDayStat?.dayIndex ?? null,
    bestCombination: bestCombStat
      ? { slot: bestCombStat.slot, dayIndex: bestCombStat.dayIndex }
      : null,
    totalSchedules: schedules.length,
    analyzedPeriod: period,
  };
}

function buildEmptyResult(
  period: "last30days" | "all"
): AttendanceTimeAnalysisResult {
  return {
    timeSlots: TIME_SLOT_META.map((m) => ({
      slot: m.slot,
      label: m.label,
      range: m.range,
      scheduleCount: 0,
      presentCount: 0,
      totalCount: 0,
      rate: 0,
    })),
    daysOfWeek: DAY_LABELS.map((label, i) => ({
      dayIndex: i,
      dayLabel: label,
      scheduleCount: 0,
      presentCount: 0,
      totalCount: 0,
      rate: 0,
    })),
    slotDayCombinations: [],
    bestSlot: null,
    bestDay: null,
    bestCombination: null,
    totalSchedules: 0,
    analyzedPeriod: period,
  };
}

export function useAttendanceTimeAnalysis(
  groupId: string,
  period: "last30days" | "all" = "last30days"
) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.attendanceTimeAnalysis(groupId, period) : null,
    () => fetchAttendanceTimeAnalysis(groupId, period),
    { revalidateOnFocus: false }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
