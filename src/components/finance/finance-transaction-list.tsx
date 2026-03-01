"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lazyLoad } from "@/lib/dynamic-import";
import { Pencil, Trash2 } from "lucide-react";
import { formatMonthLabel } from "@/components/finance/finance-filters";
import type { FinanceTransactionWithDetails } from "@/types";
import type { EntityMember } from "@/types/entity-context";

const UnpaidSummary = lazyLoad(
  () => import("@/components/finance/unpaid-summary").then((m) => ({ default: m.UnpaidSummary })),
  { skeletonHeight: "h-24" }
);
const ReceiptShareDialog = lazyLoad(
  () =>
    import("@/components/finance/receipt-share-dialog").then((m) => ({
      default: m.ReceiptShareDialog,
    })),
  { noLoading: true }
);

type MonthlyStats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

type FinanceTransactionListProps = {
  // 거래 목록
  filteredTransactions: FinanceTransactionWithDetails[];
  // 전체 거래 (미납 현황용)
  allTransactions: FinanceTransactionWithDetails[];
  // 월 필터
  selectedMonth: string;
  // 유형 필터 (빈 목록 메시지 표시용)
  typeFilter: "all" | "income" | "expense";
  // 검색어 (빈 목록 메시지 표시용)
  searchQuery: string;
  // 월별 요약 통계
  monthlyStats: MonthlyStats;
  // 액션 핸들러
  canManage: boolean;
  onEdit: (txn: FinanceTransactionWithDetails) => void;
  onDelete: (id: string) => void;
  // 닉네임 맵
  nicknameMap: Record<string, string>;
  // 멤버 목록 (미납 현황용)
  members: EntityMember[];
  // 그룹 정보 (미납 현황용)
  groupId: string;
  groupName: string;
  canManageFinance: boolean;
};

export const FinanceTransactionList = React.memo(function FinanceTransactionList({
  filteredTransactions,
  allTransactions,
  selectedMonth,
  typeFilter,
  searchQuery,
  monthlyStats,
  canManage,
  onEdit,
  onDelete,
  nicknameMap,
  members,
  groupId,
  groupName,
  canManageFinance,
}: FinanceTransactionListProps) {
  return (
    <div className="space-y-3">
      {/* 미납 현황 요약 카드 */}
      <UnpaidSummary
        transactions={allTransactions}
        members={members}
        nicknameMap={nicknameMap}
        selectedMonth={selectedMonth}
        groupId={groupId}
        groupName={groupName}
        canManageFinance={canManageFinance}
      />

      {/* 월별 요약 카드 (전체가 아닌 경우) */}
      {selectedMonth !== "all" && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">수입</p>
            <p className="text-sm font-semibold text-green-600 tabular-nums">
              +{monthlyStats.totalIncome.toLocaleString("ko-KR")}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">지출</p>
            <p className="text-sm font-semibold text-red-600 tabular-nums">
              -{monthlyStats.totalExpense.toLocaleString("ko-KR")}
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">잔액</p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                monthlyStats.balance >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {monthlyStats.balance >= 0 ? "+" : ""}
              {monthlyStats.balance.toLocaleString("ko-KR")}
            </p>
          </div>
        </div>
      )}

      {/* 거래 목록 */}
      {filteredTransactions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          {searchQuery.trim()
            ? `"${searchQuery.trim()}"에 해당하는 거래가 없습니다`
            : typeFilter !== "all"
            ? `${typeFilter === "income" ? "수입" : "지출"} 거래가 없습니다`
            : selectedMonth === "all"
            ? "거래 내역이 없습니다"
            : `${formatMonthLabel(selectedMonth)}에 거래 내역이 없습니다`}
        </p>
      ) : (
        <div className="rounded-lg border divide-y">
          {filteredTransactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between px-3 py-2 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    txn.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {txn.type === "income" ? "+" : "-"}
                  {txn.amount.toLocaleString("ko-KR")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm truncate">{txn.title}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{txn.transaction_date}</span>
                    {/* 납부자 표시 (paid_by_profile 우선, 없으면 created_by profiles) */}
                    {txn.paid_by_profile ? (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-blue-600">
                          {nicknameMap[txn.paid_by_profile.id] || txn.paid_by_profile.name}
                        </span>
                        <span className="text-muted-foreground/40">납부</span>
                      </>
                    ) : txn.profiles ? (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span>
                          {(txn.created_by && nicknameMap[txn.created_by]) || txn.profiles.name}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {txn.projects && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                    {txn.projects.name}
                  </Badge>
                )}
                {txn.finance_categories && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                    {txn.finance_categories.name}
                  </Badge>
                )}
                <ReceiptShareDialog transaction={txn} />
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(txn)}
                      aria-label="거래 수정"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(txn.id)}
                      aria-label="거래 삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
