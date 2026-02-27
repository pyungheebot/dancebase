"use client";

import useSWR from "swr";
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { AttendanceGoal } from "@/types";
import type { AttendanceStatus } from "@/types";

export type AttendanceGoalWithProgress = {
  goal: AttendanceGoal | null;
  currentRate: number;         // 현재 기간 출석률 (0~100)
  totalSchedules: number;      // 현재 기간 총 일정 수
  presentCount: number;        // 출석(지각 포함) 횟수
  remainingForGoal: number;    // 목표 달성에 필요한 추가 출석 횟수 (0이면 달성)
  periodLabel: string;         // "이번 달" | "이번 분기"
};

export function useAttendanceGoal(groupId: string) {
  const supabase = createClient();

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.attendanceGoal(groupId) : null,
    async (): Promise<AttendanceGoalWithProgress> => {
      // 1. 현재 로그인한 유저 조회
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. 출석 목표 조회
      const { data: goalData } = await supabase
        .from("attendance_goals")
        .select("*")
        .eq("group_id", groupId)
        .maybeSingle();

      const goal = goalData as AttendanceGoal | null;

      // 목표가 없으면 기본 응답 반환
      if (!goal) {
        return {
          goal: null,
          currentRate: 0,
          totalSchedules: 0,
          presentCount: 0,
          remainingForGoal: 0,
          periodLabel: "이번 달",
        };
      }

      // 3. 현재 기간 범위 계산
      const now = new Date();
      let periodFrom: string;
      let periodTo: string;
      let periodLabel: string;

      if (goal.period === "quarterly") {
        periodFrom = startOfQuarter(now).toISOString();
        periodTo = endOfQuarter(now).toISOString();
        periodLabel = "이번 분기";
      } else {
        periodFrom = startOfMonth(now).toISOString();
        periodTo = endOfMonth(now).toISOString();
        periodLabel = "이번 달";
      }

      // 4. 현재 기간 일정 조회
      const { data: scheduleRows } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", periodFrom)
        .lte("starts_at", periodTo);

      const scheduleIds = (scheduleRows ?? []).map(
        (s: { id: string }) => s.id
      );
      const totalSchedules = scheduleIds.length;

      // 일정이 없으면 출석률 0
      if (totalSchedules === 0 || !user) {
        return {
          goal,
          currentRate: 0,
          totalSchedules: 0,
          presentCount: 0,
          remainingForGoal: 0,
          periodLabel,
        };
      }

      // 5. 현재 유저의 출석 기록 조회
      const { data: attRows } = await supabase
        .from("attendance")
        .select("status")
        .in("schedule_id", scheduleIds)
        .eq("user_id", user.id);

      const rows = (attRows ?? []) as { status: AttendanceStatus }[];
      const presentCount = rows.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;

      const currentRate = Math.round((presentCount / totalSchedules) * 100);

      // 6. 목표 달성을 위해 필요한 추가 출석 횟수 계산
      // 목표 출석 횟수 = ceil(totalSchedules * targetRate / 100)
      const targetPresent = Math.ceil(
        (totalSchedules * goal.target_rate) / 100
      );
      const remainingForGoal = Math.max(0, targetPresent - presentCount);

      return {
        goal,
        currentRate,
        totalSchedules,
        presentCount,
        remainingForGoal,
        periodLabel,
      };
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
