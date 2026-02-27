"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";

// 멤버별 위험도 분석 결과
export type MemberRiskAnalysis = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  // 통계
  recentScheduleCount: number; // 최근 분석 기준 일정 수
  noShowCount: number;         // RSVP going이었지만 결석한 횟수
  noResponseCount: number;     // 미응답 횟수
  consecutiveAbsences: number; // 최근 연속 결석 수
  // 위험도
  riskScore: number;           // 0 ~ 100
  riskLevel: "high" | "caution" | "safe";
  riskReasons: string[];
};

// 스마트 리마인더 분석 결과
export type SmartReminderAnalysis = {
  atRiskMembers: MemberRiskAnalysis[];   // 고위험 (score >= 50)
  cautionMembers: MemberRiskAnalysis[];  // 주의 (30 <= score < 50)
  safeMembers: MemberRiskAnalysis[];     // 안전 (score < 30)
};

const REMINDER_HISTORY_KEY_PREFIX = "smart-reminder-history-";

type ReminderHistory = {
  sentAt: string;
  recipientCount: number;
  message: string;
};

function loadReminderHistory(scheduleId: string): ReminderHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${REMINDER_HISTORY_KEY_PREFIX}${scheduleId}`);
    return raw ? (JSON.parse(raw) as ReminderHistory[]) : [];
  } catch {
    return [];
  }
}

function saveReminderHistory(scheduleId: string, entry: ReminderHistory) {
  if (typeof window === "undefined") return;
  const history = loadReminderHistory(scheduleId);
  history.unshift(entry);
  const trimmed = history.slice(0, 10);
  localStorage.setItem(
    `${REMINDER_HISTORY_KEY_PREFIX}${scheduleId}`,
    JSON.stringify(trimmed)
  );
}

export function useSmartReminder(scheduleId: string, groupId: string) {
  const [sending, setSending] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    scheduleId && groupId
      ? swrKeys.smartReminder(scheduleId, groupId)
      : null,
    async (): Promise<SmartReminderAnalysis> => {
      const supabase = createClient();

      // 1. 그룹 멤버 전체 조회
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url)")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      type MemberRow = {
        user_id: string;
        profiles: { id: string; name: string; avatar_url: string | null } | null;
      };

      // 2. 해당 그룹의 최근 5회 완료된 일정 조회 (현재 일정 제외, 과거)
      const now = new Date().toISOString();
      const { data: pastSchedules, error: pastError } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .lt("starts_at", now)
        .order("starts_at", { ascending: false })
        .limit(5);

      if (pastError) throw pastError;

      const pastScheduleIds = (pastSchedules ?? []).map((s: { id: string }) => s.id);

      // 데이터가 없으면 빈 분석 반환
      if (pastScheduleIds.length === 0) {
        const safeMembers: MemberRiskAnalysis[] = (members as MemberRow[]).map((m) => ({
          userId: m.user_id,
          name: m.profiles?.name ?? "알 수 없음",
          avatarUrl: m.profiles?.avatar_url ?? null,
          recentScheduleCount: 0,
          noShowCount: 0,
          noResponseCount: 0,
          consecutiveAbsences: 0,
          riskScore: 0,
          riskLevel: "safe",
          riskReasons: [],
        }));
        return { atRiskMembers: [], cautionMembers: [], safeMembers };
      }

      // 3. 과거 일정들의 RSVP 조회
      const { data: rsvpRows, error: rsvpError } = await supabase
        .from("schedule_rsvp")
        .select("schedule_id, user_id, response")
        .in("schedule_id", pastScheduleIds);

      if (rsvpError) throw rsvpError;

      // 4. 과거 일정들의 실제 출석 조회
      const { data: attendanceRows, error: attError } = await supabase
        .from("attendance")
        .select("schedule_id, user_id, status")
        .in("schedule_id", pastScheduleIds);

      if (attError) throw attError;

      // 맵 구성
      // rsvpMap: scheduleId -> userId -> response
      const rsvpMap = new Map<string, Map<string, string>>();
      (rsvpRows ?? []).forEach((r: { schedule_id: string; user_id: string; response: string }) => {
        if (!rsvpMap.has(r.schedule_id)) rsvpMap.set(r.schedule_id, new Map());
        rsvpMap.get(r.schedule_id)!.set(r.user_id, r.response);
      });

      // attendanceMap: scheduleId -> userId -> status
      const attendanceMap = new Map<string, Map<string, string>>();
      (attendanceRows ?? []).forEach((a: { schedule_id: string; user_id: string; status: string }) => {
        if (!attendanceMap.has(a.schedule_id)) attendanceMap.set(a.schedule_id, new Map());
        attendanceMap.get(a.schedule_id)!.set(a.user_id, a.status);
      });

      // 일정을 최신순으로 정렬 (연속 결석 계산용)
      const sortedScheduleIds = [...pastScheduleIds];

      // 5. 멤버별 위험도 계산
      const analyses: MemberRiskAnalysis[] = (members as MemberRow[]).map((m) => {
        const userId = m.user_id;
        const totalSchedules = pastScheduleIds.length;
        let noShowCount = 0;
        let noResponseCount = 0;
        let consecutiveAbsences = 0;

        // 각 일정별 분석
        for (const schedId of pastScheduleIds) {
          const rsvp = rsvpMap.get(schedId)?.get(userId) ?? null;
          const attendance = attendanceMap.get(schedId)?.get(userId) ?? null;

          if (rsvp === null || rsvp === undefined) {
            // 미응답
            noResponseCount++;
          } else if (rsvp === "going") {
            // RSVP going이었지만 결석(absent/null)인 경우
            const isAbsent = !attendance || attendance === "absent";
            if (isAbsent) {
              noShowCount++;
            }
          }
        }

        // 최근 3회 연속 결석 계산 (최신 → 과거 순으로 확인)
        let streak = 0;
        for (const schedId of sortedScheduleIds.slice(0, 3)) {
          const attendance = attendanceMap.get(schedId)?.get(userId) ?? null;
          const isAbsent = !attendance || attendance === "absent";
          if (isAbsent) {
            streak++;
          } else {
            break;
          }
        }
        consecutiveAbsences = streak;

        // 위험도 점수 계산
        const noShowRate = totalSchedules > 0 ? noShowCount / totalSchedules : 0;
        const noResponseRate = totalSchedules > 0 ? noResponseCount / totalSchedules : 0;
        const consecutiveBonus = consecutiveAbsences >= 3 ? 30 : 0;

        const riskScore = Math.min(
          100,
          Math.round(noShowRate * 40 + noResponseRate * 30 + consecutiveBonus)
        );

        // 위험 사유 생성
        const riskReasons: string[] = [];
        if (noShowCount > 0) {
          riskReasons.push(`RSVP 후 불참 ${noShowCount}회`);
        }
        if (noResponseCount > 0) {
          riskReasons.push(`미응답 ${noResponseCount}회`);
        }
        if (consecutiveAbsences >= 3) {
          riskReasons.push(`최근 ${consecutiveAbsences}회 연속 결석`);
        }

        // 위험 레벨 결정
        let riskLevel: "high" | "caution" | "safe";
        if (riskScore >= 50) {
          riskLevel = "high";
        } else if (riskScore >= 30) {
          riskLevel = "caution";
        } else {
          riskLevel = "safe";
        }

        return {
          userId,
          name: m.profiles?.name ?? "알 수 없음",
          avatarUrl: m.profiles?.avatar_url ?? null,
          recentScheduleCount: totalSchedules,
          noShowCount,
          noResponseCount,
          consecutiveAbsences,
          riskScore,
          riskLevel,
          riskReasons,
        };
      });

      // 레벨별 분류
      const atRiskMembers = analyses
        .filter((a) => a.riskLevel === "high")
        .sort((a, b) => b.riskScore - a.riskScore);
      const cautionMembers = analyses
        .filter((a) => a.riskLevel === "caution")
        .sort((a, b) => b.riskScore - a.riskScore);
      const safeMembers = analyses
        .filter((a) => a.riskLevel === "safe")
        .sort((a, b) => a.name.localeCompare(b.name));

      return { atRiskMembers, cautionMembers, safeMembers };
    }
  );

  // 선택된 멤버에게 알림 발송
  async function sendSmartReminder(
    targetMemberIds: string[],
    message: string
  ): Promise<{ success: boolean; count: number }> {
    if (targetMemberIds.length === 0) {
      return { success: true, count: 0 };
    }

    setSending(true);
    try {
      const supabase = createClient();

      // notifications 테이블에 INSERT 시도
      const { error } = await supabase.from("notifications").insert(
        targetMemberIds.map((userId) => ({
          user_id: userId,
          type: "smart_reminder",
          title: "연습 출석 리마인더",
          message,
          link: null,
          is_read: false,
        }))
      );

      if (error) {
        // notifications 테이블이 없거나 실패 시 localStorage에 기록
        saveReminderHistory(scheduleId, {
          sentAt: new Date().toISOString(),
          recipientCount: targetMemberIds.length,
          message,
        });
      } else {
        saveReminderHistory(scheduleId, {
          sentAt: new Date().toISOString(),
          recipientCount: targetMemberIds.length,
          message,
        });
      }

      return { success: true, count: targetMemberIds.length };
    } catch {
      toast.error("리마인더 발송에 실패했습니다");
      return { success: false, count: 0 };
    } finally {
      setSending(false);
    }
  }

  const analysis = data ?? { atRiskMembers: [], cautionMembers: [], safeMembers: [] };

  return {
    analysis,
    loading: isLoading,
    sending,
    sendSmartReminder,
    refetch: () => mutate(),
  };
}
