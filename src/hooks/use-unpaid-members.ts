"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { differenceInDays, parseISO } from "date-fns";

export type UnpaidMemberSummary = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalUnpaidAmount: number;
  oldestUnpaidDate: string; // "YYYY-MM-DD"
  daysOverdue: number; // 오늘 기준 가장 오래된 미납 경과 일수
  unpaidCount: number; // 미납 거래 건수
};

export function useUnpaidMembers(groupId: string, projectId?: string | null) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.unpaidMembers(groupId, projectId),
    async (): Promise<UnpaidMemberSummary[]> => {
      const supabase = createClient();

      // paid_by가 null인 income 거래 조회 (= 납부자 미지정 = 미납)
      let query = supabase
        .from("finance_transactions")
        .select(
          "id, amount, transaction_date, paid_by, profiles!finance_transactions_created_by_fkey(id, name, avatar_url)"
        )
        .eq("group_id", groupId)
        .eq("type", "income")
        .is("paid_by", null)
        .order("transaction_date", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data: txns, error } = await query;

      if (error || !txns || txns.length === 0) {
        return [];
      }

      // paid_by가 있는 income 거래에서 실제로 납부한 멤버별 집계를 위해
      // 별도로 paid_by 있는 거래를 조회해 미납 멤버 파악
      let paidQuery = supabase
        .from("finance_transactions")
        .select(
          "paid_by, transaction_date, amount, paid_by_profile:profiles!finance_transactions_paid_by_fkey(id, name, avatar_url)"
        )
        .eq("group_id", groupId)
        .eq("type", "income")
        .not("paid_by", "is", null);

      if (projectId) {
        paidQuery = paidQuery.eq("project_id", projectId);
      }

      const { data: paidTxns } = await paidQuery;

      // 납부자 지정된 거래가 없으면, 납부자 미지정 거래 자체를 미납으로 처리
      // (가상의 멤버 항목 대신, 거래 자체를 건별로 표시)
      if (!paidTxns || paidTxns.length === 0) {
        // 납부자 지정 데이터가 아예 없으면 빈 배열 반환
        // (UnpaidSummary 컴포넌트가 이미 납부자 미지정 거래를 별도 표시)
        return [];
      }

      type PaidTxn = {
        paid_by: string | null;
        transaction_date: string | null;
        amount: number;
        paid_by_profile: { id: string; name: string; avatar_url: string | null } | null;
      };

      // paid_by 있는 거래에서 납부한 userId 집합 계산 (날짜별)
      const paidByDate: Record<string, Set<string>> = {};
      (paidTxns as PaidTxn[]).forEach((txn) => {
        if (txn.paid_by && txn.transaction_date) {
          const date = txn.transaction_date.slice(0, 7); // YYYY-MM
          if (!paidByDate[date]) paidByDate[date] = new Set();
          paidByDate[date].add(txn.paid_by);
        }
      });

      // 납부자 있는 월 목록
      const activeMonths = Object.keys(paidByDate).sort();
      if (activeMonths.length === 0) return [];

      // 각 월에서 납부하지 않은 멤버 파악
      // paid_by 있는 거래에서 등장한 모든 유저 목록 수집
      const allPayerIds = new Set<string>();
      (paidTxns as PaidTxn[]).forEach((txn) => {
        if (txn.paid_by) allPayerIds.add(txn.paid_by);
      });

      // 멤버별 미납 집계
      const memberUnpaidMap: Record<
        string,
        {
          name: string;
          avatarUrl: string | null;
          totalAmount: number;
          dates: string[];
        }
      > = {};

      // paidTxns에서 프로필 정보 수집
      const profileMap: Record<string, { name: string; avatarUrl: string | null }> = {};
      (paidTxns as PaidTxn[]).forEach((txn) => {
        if (txn.paid_by && txn.paid_by_profile) {
          const profile = txn.paid_by_profile;
          profileMap[txn.paid_by] = {
            name: profile.name,
            avatarUrl: profile.avatar_url,
          };
        }
      });

      activeMonths.forEach((month) => {
        const paidSet = paidByDate[month];
        // 해당 월의 납부 금액 (납부한 사람들 중 평균)
        const monthPaidTxns = (paidTxns as PaidTxn[]).filter(
          (txn) => txn.paid_by && txn.transaction_date?.startsWith(month)
        );
        const avgAmount =
          monthPaidTxns.length > 0
            ? Math.round(
                monthPaidTxns.reduce((s: number, t: PaidTxn) => s + t.amount, 0) /
                  monthPaidTxns.length
              )
            : 0;

        // 해당 월에 납부하지 않은 사람
        allPayerIds.forEach((userId) => {
          if (!paidSet.has(userId)) {
            if (!memberUnpaidMap[userId]) {
              const profile = profileMap[userId];
              memberUnpaidMap[userId] = {
                name: profile?.name ?? userId,
                avatarUrl: profile?.avatarUrl ?? null,
                totalAmount: 0,
                dates: [],
              };
            }
            memberUnpaidMap[userId].totalAmount += avgAmount;
            memberUnpaidMap[userId].dates.push(month + "-01");
          }
        });
      });

      const today = new Date();

      return Object.entries(memberUnpaidMap)
        .map(([userId, info]) => {
          const oldestDate = info.dates.sort()[0] ?? today.toISOString().slice(0, 10);
          let daysOverdue = 0;
          try {
            daysOverdue = differenceInDays(today, parseISO(oldestDate));
            if (daysOverdue < 0) daysOverdue = 0;
          } catch {
            daysOverdue = 0;
          }
          return {
            userId,
            name: info.name,
            avatarUrl: info.avatarUrl,
            totalUnpaidAmount: info.totalAmount,
            oldestUnpaidDate: oldestDate,
            daysOverdue,
            unpaidCount: info.dates.length,
          } satisfies UnpaidMemberSummary;
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
    }
  );

  return {
    unpaidMembers: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
