"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { DelinquencyWorkflow } from "@/components/finance/delinquency-workflow";
import type { FinanceTransactionWithDetails } from "@/types";
import type { EntityMember } from "@/types/entity-context";

type Props = {
  transactions: FinanceTransactionWithDetails[];
  members: EntityMember[];
  nicknameMap: Record<string, string>;
  selectedMonth: string; // "YYYY-MM" 또는 "all"
  // 알림 기능용 추가 props
  groupId?: string;
  groupName?: string;
  canManageFinance?: boolean;
};

type UnpaidRow = {
  txnId: string;
  title: string;
  amount: number;
  transactionDate: string;
};

export function UnpaidSummary({
  transactions,
  members,
  nicknameMap,
  selectedMonth,
  groupId,
  groupName,
  canManageFinance = false,
}: Props) {
  const [showWorkflow, setShowWorkflow] = useState(false);

  // 미납 집계: 수입(income) 거래 중 paid_by가 null인 것
  const unpaidTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchMonth =
        selectedMonth === "all" || txn.transaction_date?.startsWith(selectedMonth);
      return txn.type === "income" && txn.paid_by === null && matchMonth;
    });
  }, [transactions, selectedMonth]);

  const totalUnpaidAmount = useMemo(
    () => unpaidTransactions.reduce((sum, txn) => sum + txn.amount, 0),
    [unpaidTransactions]
  );

  // 멤버별 미납 집계 (paid_by가 null → 해당 월 전체 멤버 대상으로 간주하지 않고,
  // 단순히 paid_by 없는 수입 거래를 미납 항목으로 표시)
  const unpaidRows: UnpaidRow[] = useMemo(() => {
    return unpaidTransactions.map((txn) => ({
      txnId: txn.id,
      title: txn.title,
      amount: txn.amount,
      transactionDate: txn.transaction_date ?? "",
    }));
  }, [unpaidTransactions]);

  // 납부자 지정된 수입 거래 기반으로 미납 멤버 파악
  // 선택 월의 paid_by 있는 수입 거래의 paid_by 집합
  const paidMemberIds = useMemo(() => {
    return new Set(
      transactions
        .filter(
          (txn) =>
            txn.type === "income" &&
            txn.paid_by !== null &&
            (selectedMonth === "all" || txn.transaction_date?.startsWith(selectedMonth))
        )
        .map((txn) => txn.paid_by as string)
    );
  }, [transactions, selectedMonth]);

  // 납부자 지정된 수입 거래가 존재하는 경우, 납부하지 않은 멤버 파악
  const hasPaidByData = useMemo(() => {
    return transactions.some(
      (txn) =>
        txn.type === "income" &&
        txn.paid_by !== null &&
        (selectedMonth === "all" || txn.transaction_date?.startsWith(selectedMonth))
    );
  }, [transactions, selectedMonth]);

  const unpaidMembers = useMemo(() => {
    if (!hasPaidByData) return [];
    return members
      .filter((m) => !paidMemberIds.has(m.userId))
      .map((m) => ({
        userId: m.userId,
        name: nicknameMap[m.userId] || m.profile.name,
      }));
  }, [members, paidMemberIds, nicknameMap, hasPaidByData]);

  // 알림 워크플로우를 표시할 수 있는지: groupId, canManageFinance 및 paid_by 데이터가 있을 때
  const canShowWorkflow = !!(groupId && canManageFinance && hasPaidByData);

  // 표시할 내용이 없으면 렌더링 안 함
  if (unpaidRows.length === 0 && unpaidMembers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/60 dark:bg-orange-950/10 dark:border-orange-900/40 mb-3 p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
            미납 현황
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalUnpaidAmount > 0 && (
            <span className="text-xs font-semibold tabular-nums text-orange-600 dark:text-orange-400">
              총 {totalUnpaidAmount.toLocaleString("ko-KR")}원 미납
            </span>
          )}
          {canShowWorkflow && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2 gap-1 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
              onClick={() => setShowWorkflow((v) => !v)}
            >
              <Bell className="h-3 w-3" />
              미납 알림
              {showWorkflow ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 납부자 미지정 수입 거래 목록 */}
      {unpaidRows.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">납부자 미지정 수입 거래</p>
          <div className="rounded-md border border-orange-200/70 dark:border-orange-900/30 divide-y divide-orange-100 dark:divide-orange-900/20 overflow-hidden">
            {unpaidRows.map((row) => (
              <div
                key={row.txnId}
                className="flex items-center justify-between px-2.5 py-1.5 bg-white/60 dark:bg-background/20"
              >
                <div className="min-w-0">
                  <p className="text-xs truncate">{row.title}</p>
                  <p className="text-[10px] text-muted-foreground">{row.transactionDate}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-orange-600 dark:text-orange-400 shrink-0 ml-2">
                  +{row.amount.toLocaleString("ko-KR")}원
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 미납 멤버 목록 (납부자 데이터가 있는 경우에만) */}
      {unpaidMembers.length > 0 && !showWorkflow && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">
            미납 멤버 ({unpaidMembers.length}명)
          </p>
          <div className="flex flex-wrap gap-1">
            {unpaidMembers.map((m) => (
              <Badge
                key={m.userId}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
              >
                {m.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 미납 알림 워크플로우 (토글) */}
      {showWorkflow && canShowWorkflow && groupId && groupName && (
        <div className="border-t border-orange-200 dark:border-orange-900/40 pt-2 mt-1">
          <DelinquencyWorkflow
            transactions={transactions}
            members={members}
            nicknameMap={nicknameMap}
            groupId={groupId}
            groupName={groupName}
            canManageFinance={canManageFinance}
          />
        </div>
      )}
    </div>
  );
}
