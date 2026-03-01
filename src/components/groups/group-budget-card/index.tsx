"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Wallet,
  Plus,
  ChevronDown,
  ChevronUp,
  Filter,
  Settings2,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupBudget } from "@/hooks/use-group-budget";
import type { GroupBudgetTransaction } from "@/types";

import { TransactionDialog } from "./transaction-dialog";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { BudgetLimitDialog } from "./budget-limit-dialog";
import { CategoryChart } from "./category-chart";
import { TransactionItem } from "./transaction-item";
import { BudgetSummaryStats, BudgetProgress } from "./budget-summary";
import {
  type FilterType,
  FILTER_OPTIONS,
  TRANSACTION_PAGE_SIZE,
} from "./types";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function GroupBudgetCard({ groupId }: { groupId: string }) {
  const {
    data,
    loading,
    stats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    removeCategory,
    setMonthlyLimit,
  } = useGroupBudget(groupId);

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupBudgetTransaction | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAll, setShowAll] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const transactionListId = "transaction-list";

  // 필터링된 거래 목록
  const filteredTransactions = useMemo(() => {
    const txs = [...data.transactions].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    if (filter === "all") return txs;
    return txs.filter((t) => t.type === filter);
  }, [data.transactions, filter]);

  const displayedTransactions = showAll
    ? filteredTransactions
    : filteredTransactions.slice(0, TRANSACTION_PAGE_SIZE);

  const hasMore = filteredTransactions.length > TRANSACTION_PAGE_SIZE;
  const hiddenCount = filteredTransactions.length - TRANSACTION_PAGE_SIZE;

  // 월별 예산 진행률 여부
  const hasBudgetLimit =
    data.monthlyBudgetLimit !== null && data.monthlyBudgetLimit > 0;

  // 핸들러
  const handleAddTransaction = useCallback(
    async (payload: Omit<GroupBudgetTransaction, "id" | "createdAt">) => {
      if (editTarget) {
        await updateTransaction(editTarget.id, payload);
      } else {
        await addTransaction(payload);
      }
    },
    [editTarget, updateTransaction, addTransaction]
  );

  const openEditDialog = useCallback((tx: GroupBudgetTransaction) => {
    setEditTarget(tx);
    setTxDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setTxDialogOpen(false);
    setEditTarget(null);
  }, []);

  const handleDelete = useCallback(
    async (txId: string) => {
      const ok = await deleteTransaction(txId);
      if (ok) {
        toast.success(TOAST.GROUP_BUDGET.TRANSACTION_DELETED);
      } else {
        toast.error(TOAST.DELETE_ERROR);
      }
    },
    [deleteTransaction]
  );

  function openAddDialog() {
    setEditTarget(null);
    setTxDialogOpen(true);
  }

  // 빈 상태 메시지
  function emptyMessage() {
    if (filter === "income") return "수입 내역이 없습니다";
    if (filter === "expense") return "지출 내역이 없습니다";
    return "아직 거래 내역이 없습니다";
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            로딩 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Wallet className="h-4 w-4 text-blue-500" aria-hidden="true" />
              그룹 예산 트래커
            </CardTitle>
            <div className="flex items-center gap-1" role="group" aria-label="예산 관리 메뉴">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setLimitDialogOpen(true)}
                aria-label="예산 한도 설정"
              >
                <Settings2 className="mr-1 h-3 w-3" aria-hidden="true" />
                한도
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCatDialogOpen(true)}
                aria-label="카테고리 관리"
              >
                <Tag className="mr-1 h-3 w-3" aria-hidden="true" />
                카테고리
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={openAddDialog}
                aria-label="거래 추가"
              >
                <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                추가
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          <BudgetSummaryStats stats={stats} />

          {/* 월별 예산 진행률 */}
          {hasBudgetLimit && (
            <BudgetProgress
              monthlySpending={stats.monthlySpending}
              monthlyBudgetLimit={data.monthlyBudgetLimit!}
            />
          )}

          <Separator />

          {/* 카테고리별 지출 분포 토글 */}
          {stats.categoryBreakdown.length > 0 && (
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between text-xs font-medium hover:text-foreground/80"
                onClick={() => setShowChart((v) => !v)}
                aria-expanded={showChart}
                aria-controls="category-chart-panel"
              >
                <span>카테고리별 지출 분포</span>
                {showChart ? (
                  <ChevronUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                )}
              </button>
              <div
                id="category-chart-panel"
                hidden={!showChart}
                aria-live="polite"
              >
                {showChart && (
                  <div className="mt-2">
                    <CategoryChart breakdown={stats.categoryBreakdown} />
                  </div>
                )}
              </div>
            </div>
          )}

          {stats.categoryBreakdown.length > 0 && <Separator />}

          {/* 거래 내역 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" id="transaction-list-label">
                거래 내역
              </span>
              <div className="flex items-center gap-1" role="group" aria-label="거래 필터">
                <Filter className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                {FILTER_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                      filter === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-6 text-center"
                role="status"
                aria-live="polite"
              >
                <Wallet className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">{emptyMessage()}</p>
                {filter === "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={openAddDialog}
                  >
                    <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                    거래 추가하기
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1" aria-live="polite">
                <ul
                  id={transactionListId}
                  role="list"
                  aria-labelledby="transaction-list-label"
                  className="space-y-1"
                >
                  {displayedTransactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      categories={data.categories}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>

                {hasMore && (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAll((v) => !v)}
                    aria-expanded={showAll}
                    aria-controls={transactionListId}
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-3 w-3" aria-hidden="true" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" aria-hidden="true" />
                        {hiddenCount}개 더 보기
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 거래 추가/수정 다이얼로그 */}
      {txDialogOpen && (
        <TransactionDialog
          open={txDialogOpen}
          onClose={closeDialog}
          onSubmit={handleAddTransaction}
          categories={data.categories}
          initial={editTarget}
        />
      )}

      {/* 카테고리 관리 다이얼로그 */}
      <CategoryManagerDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        categories={data.categories}
        onAdd={addCategory}
        onRemove={removeCategory}
      />

      {/* 예산 한도 설정 다이얼로그 */}
      <BudgetLimitDialog
        open={limitDialogOpen}
        onClose={() => setLimitDialogOpen(false)}
        currentLimit={data.monthlyBudgetLimit}
        onSave={setMonthlyLimit}
      />
    </>
  );
}
