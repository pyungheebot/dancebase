"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { AttendanceCertificateData } from "@/types";

type FetchParams = {
  groupId: string;
  userId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
};

async function fetchCertificateData(
  params: FetchParams
): Promise<AttendanceCertificateData> {
  const { groupId, userId, periodStart, periodEnd } = params;
  const supabase = createClient();

  // 1. 그룹 정보 조회
  const { data: groupData, error: groupErr } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (groupErr) throw groupErr;

  // 2. 프로필 정보 조회
  const { data: profileData, error: profileErr } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();

  if (profileErr) throw profileErr;

  // 3. 기간 내 출석 대상 일정 조회
  const { data: scheduleRows, error: schedErr } = await supabase
    .from("schedules")
    .select("id, starts_at")
    .eq("group_id", groupId)
    .neq("attendance_method", "none")
    .gte("starts_at", `${periodStart}T00:00:00`)
    .lte("starts_at", `${periodEnd}T23:59:59`)
    .order("starts_at", { ascending: true });

  if (schedErr) throw schedErr;

  const schedules = scheduleRows ?? [];
  const totalSchedules = schedules.length;

  if (totalSchedules === 0) {
    return {
      memberName: profileData.name ?? "알 수 없음",
      groupName: groupData.name ?? "알 수 없음",
      periodStart,
      periodEnd,
      totalSchedules: 0,
      attendedCount: 0,
      attendanceRate: 0,
      longestStreak: 0,
      issuedAt: new Date().toISOString().split("T")[0],
    };
  }

  const scheduleIds = schedules.map((s: { id: string }) => s.id);

  // 4. 해당 유저의 출석 기록 조회
  const { data: attRows, error: attErr } = await supabase
    .from("attendance")
    .select("schedule_id, status")
    .eq("user_id", userId)
    .in("schedule_id", scheduleIds);

  if (attErr) throw attErr;

  // schedule_id -> status 맵
  const statusMap = new Map<string, string>();
  for (const row of attRows ?? []) {
    statusMap.set(row.schedule_id, row.status);
  }

  // 일정 순서대로 출석 여부 배열 구성
  const orderedPresent = schedules.map(
    (s: { id: string }) => statusMap.get(s.id) === "present"
  );

  const attendedCount = orderedPresent.filter(Boolean).length;
  const attendanceRate =
    totalSchedules > 0
      ? Math.round((attendedCount / totalSchedules) * 100)
      : 0;

  // 최장 연속 출석 계산
  let longestStreak = 0;
  let tempStreak = 0;
  for (const isPresent of orderedPresent) {
    if (isPresent) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return {
    memberName: profileData.name ?? "알 수 없음",
    groupName: groupData.name ?? "알 수 없음",
    periodStart,
    periodEnd,
    totalSchedules,
    attendedCount,
    attendanceRate,
    longestStreak,
    issuedAt: new Date().toISOString().split("T")[0],
  };
}

type UseAttendanceCertificateParams = {
  groupId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
};

export function useAttendanceCertificate({
  groupId,
  userId,
  periodStart,
  periodEnd,
}: UseAttendanceCertificateParams) {
  const key =
    groupId && userId && periodStart && periodEnd
      ? `${swrKeys.attendanceCertificate(groupId, userId)}?start=${periodStart}&end=${periodEnd}`
      : null;

  const { data, isLoading, error, mutate } = useSWR(
    key,
    () => fetchCertificateData({ groupId, userId, periodStart, periodEnd }),
    { revalidateOnFocus: false }
  );

  return {
    certificate: data ?? null,
    loading: isLoading,
    error,
    refetch: () => mutate(),
  };
}
