"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import {
  type ScheduleAttendancePrediction,
  type ScheduleAttendancePredictorResult,
  type TimeSlot,
  TIME_SLOTS,
  DAY_OF_WEEK_LABELS,
} from "@/types/index";

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
// 집계 엔트리 타입
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
      if (hour >= 22 || hour < 6) return "night";
    } else {
      if (hour >= slot.startHour && hour < slot.endHour) return slot.key;
    }
  }
  return "morning";
}

// ────────────────────────────────────────────────────────────────────────────
// 가중 평균 확률 계산
// 전체 40%, 같은 요일 35%, 같은 시간대 25%
// ────────────────────────────────────────────────────────────────────────────

function calcWeightedProbability(
  overallRate: number,
  sameDayRate: number,
  sameSlotRate: number,
): number {
  return Math.round(overallRate * 0.4 + sameDayRate * 0.35 + sameSlotRate * 0.25);
}

// ────────────────────────────────────────────────────────────────────────────
// 확률 기반 라벨 결정
// ────────────────────────────────────────────────────────────────────────────

function getPredictionLabel(
  probability: number,
): "참석 예상" | "불확실" | "불참 가능" {
  if (probability >= 80) return "참석 예상";
  if (probability >= 50) return "불확실";
  return "불참 가능";
}

// ────────────────────────────────────────────────────────────────────────────
// 집계 맵에서 특정 userId 전체 출석률 계산 (전체 요일·시간대 통합)
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────────────

export function useScheduleAttendancePredictor(
  groupId: string,
  scheduleId: string,
): ScheduleAttendancePredictorResult {
  const { data, isLoading, mutate } = useSWR(
    groupId && scheduleId
      ? swrKeys.scheduleAttendancePredictor(groupId, scheduleId)
      : null,
    async () => {
      const supabase = createClient();

      // 1) 대상 일정 정보 조회
      const { data: targetSchedule, error: targetErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("id", scheduleId)
        .single();

      if (targetErr) throw targetErr;
      if (!targetSchedule) throw new Error("일정을 찾을 수 없습니다.");

      const targetDate = new Date(targetSchedule.starts_at);
      const targetDayOfWeek = targetDate.getDay(); // 0(일) ~ 6(토)
      const targetHour = targetDate.getHours();
      const targetTimeSlot = getTimeSlot(targetHour);

      // 2) 최근 3개월 기준일
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // 3) 최근 3개월 출석 체크 대상 일정 조회 (대상 일정 제외)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .neq("id", scheduleId)
        .gte("starts_at", threeMonthsAgo.toISOString())
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const schedules: RawScheduleRow[] = scheduleRows ?? [];

      // 4) 그룹 멤버 + 프로필 이름 조회
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

      // 데이터가 없으면 빈 결과 반환
      if (schedules.length === 0) {
        return {
          predictions: [],
          targetDayOfWeek,
          targetTimeSlot,
          targetHour,
          startsAt: targetSchedule.starts_at,
          totalSamples: 0,
          memberNames,
          hasData: false,
        };
      }

      const scheduleIds = schedules.map((s) => s.id);

      // 5) 출석 기록 조회
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, user_id, status")
        .in("schedule_id", scheduleIds);

      if (attErr) throw attErr;

      const attendances: RawAttendanceRow[] = attRows ?? [];

      // 6) scheduleId -> { dayOfWeek, timeSlot } 맵
      const scheduleMetaMap = new Map<string, { dayOfWeek: number; timeSlot: TimeSlot }>();
      for (const s of schedules) {
        const date = new Date(s.starts_at);
        scheduleMetaMap.set(s.id, {
          dayOfWeek: date.getDay(),
          timeSlot: getTimeSlot(date.getHours()),
        });
      }

      // 7) 집계 맵 구성
      // 키 형식:
      //   전체: `${userId}-overall`
      //   요일별: `${userId}-day-${dayOfWeek}`
      //   시간대별: `${userId}-slot-${timeSlot}`
      const aggregateMap = new Map<string, AggregateEntry>();

      const inc = (key: string, isPresent: boolean) => {
        const entry = aggregateMap.get(key) ?? { present: 0, total: 0 };
        entry.total += 1;
        if (isPresent) entry.present += 1;
        aggregateMap.set(key, entry);
      };

      for (const att of attendances) {
        const meta = scheduleMetaMap.get(att.schedule_id);
        if (!meta) continue;
        if (!memberNames.has(att.user_id)) continue;

        const isPresent = att.status === "present" || att.status === "late";

        inc(`${att.user_id}-overall`, isPresent);
        inc(`${att.user_id}-day-${meta.dayOfWeek}`, isPresent);
        inc(`${att.user_id}-slot-${meta.timeSlot}`, isPresent);
      }

      // 8) 멤버별 예측 계산
      const predictions: ScheduleAttendancePrediction[] = [];

      for (const [userId, name] of memberNames.entries()) {
        // 전체 출석률
        const overallEntry = aggregateMap.get(`${userId}-overall`);
        const overallRate =
          overallEntry && overallEntry.total > 0
            ? Math.round((overallEntry.present / overallEntry.total) * 100)
            : 50; // 데이터 없으면 중립값 50

        // 같은 요일 출석률
        const dayEntry = aggregateMap.get(`${userId}-day-${targetDayOfWeek}`);
        const sameDayRate =
          dayEntry && dayEntry.total > 0
            ? Math.round((dayEntry.present / dayEntry.total) * 100)
            : overallRate; // 데이터 없으면 전체 출석률로 fallback

        // 같은 시간대 출석률
        const slotEntry = aggregateMap.get(`${userId}-slot-${targetTimeSlot}`);
        const sameSlotRate =
          slotEntry && slotEntry.total > 0
            ? Math.round((slotEntry.present / slotEntry.total) * 100)
            : overallRate; // 데이터 없으면 전체 출석률로 fallback

        const probability = calcWeightedProbability(overallRate, sameDayRate, sameSlotRate);

        const sampleCount = overallEntry?.total ?? 0;

        predictions.push({
          userId,
          name,
          probability,
          overallRate,
          sameDayRate,
          sameSlotRate,
          sampleCount,
          label: getPredictionLabel(probability),
        });
      }

      // 확률 내림차순 정렬
      predictions.sort((a, b) => b.probability - a.probability);

      // 총 표본 수 (중복 제거: 전체 집계 기준)
      let totalSamples = 0;
      for (const [key, entry] of aggregateMap.entries()) {
        if (key.endsWith("-overall")) {
          totalSamples += entry.total;
        }
      }

      return {
        predictions,
        targetDayOfWeek,
        targetTimeSlot,
        targetHour,
        startsAt: targetSchedule.starts_at,
        totalSamples,
        memberNames,
        hasData: attendances.length > 0,
      };
    },
  );

  // 분석 요약 문자열 생성
  const analysisSummary = (() => {
    if (!data) return "";
    const dayLabel = DAY_OF_WEEK_LABELS[data.targetDayOfWeek] ?? "";
    const slotLabel =
      TIME_SLOTS.find((s) => s.key === data.targetTimeSlot)?.label ?? "";
    const count = data.totalSamples;
    return `${dayLabel}요일 ${slotLabel} 기준 과거 데이터 ${count}건 분석`;
  })();

  const predictions = data?.predictions ?? [];
  const expectedCount = predictions.filter((p) => p.probability >= 50).length;
  const totalCount = predictions.length;

  return {
    predictions,
    expectedCount,
    totalCount,
    analysisSummary,
    dayOfWeek: data?.targetDayOfWeek ?? 0,
    timeSlot: data?.targetTimeSlot ?? "afternoon",
    startsAt: data?.startsAt ?? "",
    hasData: data?.hasData ?? false,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
