"use client";

import useSWR from "swr";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// 위험 등급
// ============================================

export type RiskLevel = "high" | "medium";

// ============================================
// 위험 멤버 정보
// ============================================

export type MemberRiskInfo = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 최근 3개월 출석률 (0~100 사이의 정수) */
  attendanceRate: number;
  /** 미납 건수 */
  unpaidCount: number;
  /** 위험 등급: high(출석<50% AND 미납>=1) | medium(출석<50% OR 미납>=1) */
  riskLevel: RiskLevel;
  /** 출석 주의 여부 */
  isAttendanceRisk: boolean;
  /** 납부 주의 여부 */
  isPaymentRisk: boolean;
};

// ============================================
// 훅
// ============================================

export function useMemberRisk(groupId: string, members: EntityMember[]) {
  const { data, isLoading, mutate } = useSWR(
    groupId && members.length > 0 ? swrKeys.memberRisk(groupId) : null,
    async (): Promise<MemberRiskInfo[]> => {
      const supabase = createClient();

      // 최근 3개월 범위 계산
      const now = new Date();
      const from = startOfMonth(subMonths(now, 2)).toISOString();
      const to = endOfMonth(now).toISOString();

      // 1. 최근 3개월 일정 조회 (출석 체크 대상 일정만)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", from)
        .lte("starts_at", to);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const schedules = scheduleRows ?? [];
      const scheduleIds = schedules.map((s: { id: string }) => s.id);

      // 2. 출석 기록 조회
      type AttendanceRow = { schedule_id: string; user_id: string; status: string };
      let attendances: AttendanceRow[] = [];

      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, user_id, status")
          .in("schedule_id", scheduleIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attendances = (attData ?? []) as AttendanceRow[];
      }

      const totalSchedules = scheduleIds.length;

      // 3. 미납 멤버 조회 (최근 3개월, paid_by 있는 income 거래 기준)
      const { data: paidTxns, error: paidErr } = await supabase
        .from("finance_transactions")
        .select("paid_by, transaction_date")
        .eq("group_id", groupId)
        .eq("type", "income")
        .not("paid_by", "is", null)
        .gte("transaction_date", from.slice(0, 10))
        .lte("transaction_date", to.slice(0, 10));

      if (paidErr) throw new Error("회비 데이터를 불러오지 못했습니다");

      // 납부자별 납부 월 집합 구성
      const paidMonthsByUser: Record<string, Set<string>> = {};
      (paidTxns ?? []).forEach((txn: { paid_by: string | null; transaction_date: string }) => {
        const userId = txn.paid_by as string;
        const month = (txn.transaction_date as string).slice(0, 7); // YYYY-MM
        if (!paidMonthsByUser[userId]) paidMonthsByUser[userId] = new Set();
        paidMonthsByUser[userId].add(month);
      });

      // 회비 데이터에 등장한 전체 월 목록
      const allPaidMonths = new Set<string>();
      Object.values(paidMonthsByUser).forEach((months) => {
        months.forEach((m) => allPaidMonths.add(m));
      });
      const activeMonthCount = allPaidMonths.size;

      // 4. 각 멤버별 위험 분석
      const result: MemberRiskInfo[] = [];

      for (const member of members) {
        const userId = member.userId;
        const name = member.nickname || member.profile.name;
        const avatarUrl = member.profile.avatar_url;

        // --- 출석률 계산 ---
        let attendanceRate = 100;
        if (totalSchedules > 0) {
          const presentCount = attendances.filter(
            (a) => a.user_id === userId && (a.status === "present" || a.status === "late")
          ).length;
          attendanceRate = Math.round((presentCount / totalSchedules) * 100);
        }
        const isAttendanceRisk = totalSchedules > 0 && attendanceRate < 50;

        // --- 미납 건수 계산 ---
        let unpaidCount = 0;
        if (activeMonthCount > 0) {
          const userPaidMonths = paidMonthsByUser[userId]?.size ?? 0;
          unpaidCount = Math.max(0, activeMonthCount - userPaidMonths);
        }
        const isPaymentRisk = unpaidCount >= 1;

        // 두 조건 모두 해당 없으면 제외
        if (!isAttendanceRisk && !isPaymentRisk) continue;

        // --- 위험 등급 결정 ---
        const riskLevel: RiskLevel =
          isAttendanceRisk && isPaymentRisk ? "high" : "medium";

        result.push({
          userId,
          name,
          avatarUrl,
          attendanceRate,
          unpaidCount,
          riskLevel,
          isAttendanceRisk,
          isPaymentRisk,
        });
      }

      // 위험 등급 높은 순 → 출석률 낮은 순 정렬
      result.sort((a, b) => {
        if (a.riskLevel !== b.riskLevel) {
          return a.riskLevel === "high" ? -1 : 1;
        }
        return a.attendanceRate - b.attendanceRate;
      });

      return result;
    }
  );

  return {
    riskMembers: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
