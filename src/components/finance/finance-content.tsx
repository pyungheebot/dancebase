"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { FinanceTransactionForm } from "@/components/groups/finance-transaction-form";
import { FinanceCategoryManager } from "@/components/groups/finance-category-manager";
import { FinancePermissionManager } from "@/components/groups/finance-permission-manager";
import { FinanceStats } from "@/components/groups/finance-stats";
import { FinancePaymentStatus } from "@/components/finance/finance-payment-status";
import { FinanceBudgetTab } from "@/components/finance/finance-budget-tab";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { EntityContext } from "@/types/entity-context";
import type {
  FinanceRole,
  FinanceTransaction,
  FinanceTransactionWithDetails,
  FinanceCategory,
  GroupMemberWithProfile,
} from "@/types";

type FinanceContentProps = {
  ctx: EntityContext;
  financeRole: FinanceRole | null;
  transactions: FinanceTransactionWithDetails[];
  categories: FinanceCategory[];
  stats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    byCategory: Array<{
      category: FinanceCategory;
      income: number;
      expense: number;
    }>;
  };
  refetch: () => void;
  // 그룹 전용 (features.financePermissionManager)
  groupMembers?: GroupMemberWithProfile[];
};

// 최근 N개월 옵션 생성
function buildMonthOptions(transactions: FinanceTransactionWithDetails[]) {
  const monthSet = new Set<string>();
  transactions.forEach((txn) => {
    if (txn.transaction_date) {
      monthSet.add(txn.transaction_date.slice(0, 7)); // "YYYY-MM"
    }
  });

  // 없으면 현재 월 포함
  const now = format(new Date(), "yyyy-MM");
  monthSet.add(now);

  // 내림차순 정렬
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}

// 월 레이블 포맷: "2026-02" → "2026년 2월"
function formatMonthLabel(ym: string) {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

export function FinanceContent({
  ctx,
  financeRole,
  transactions,
  categories,
  stats,
  refetch,
  groupMembers,
}: FinanceContentProps) {
  const supabase = createClient();
  const [editingTxn, setEditingTxn] = useState<FinanceTransaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 월 필터: 기본값은 현재 월
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const isManager = financeRole === "manager";
  const canManage = isManager || ctx.permissions.canEdit;

  // 월 옵션 목록
  const monthOptions = useMemo(() => buildMonthOptions(transactions), [transactions]);

  // 선택된 월에 해당하는 거래만 필터링
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "all") return transactions;
    return transactions.filter((txn) =>
      txn.transaction_date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // 선택된 월의 수입/지출/잔액 계산
  const monthlyStats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const byCategory = categories.map((cat) => {
      const catTxns = filteredTransactions.filter((t) => t.category_id === cat.id);
      const income = catTxns
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = catTxns
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { category: cat, income, expense };
    });

    const uncategorized = filteredTransactions.filter((t) => !t.category_id);
    if (uncategorized.length > 0) {
      byCategory.push({
        category: {
          id: "",
          group_id: ctx.groupId,
          project_id: null,
          name: "미분류",
          sort_order: 999,
          created_at: "",
        },
        income: uncategorized
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0),
        expense: uncategorized
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
      });
    }

    return { totalIncome, totalExpense, balance, byCategory };
  }, [filteredTransactions, categories, ctx.groupId]);

  // 폼에 전달할 멤버 옵션 (GroupMemberWithProfile → { id, name })
  const memberOptions = useMemo(() => {
    if (!groupMembers) return undefined;
    return groupMembers.map((m) => ({
      id: m.user_id,
      name: ctx.nicknameMap[m.user_id] || m.profiles.name,
    }));
  }, [groupMembers, ctx.nicknameMap]);

  const handleDownloadCsv = () => {
    const label = selectedMonth === "all" ? "전체" : selectedMonth;
    const filename = `회비내역_${label}.csv`;

    const headers = ["날짜", "유형", "카테고리", "금액", "설명", "납부자"];
    const rows = filteredTransactions.map((txn) => {
      const typeLabel = txn.type === "income" ? "수입" : "지출";
      const category = txn.finance_categories?.name ?? "";
      const payer = txn.paid_by_profile
        ? ctx.nicknameMap[txn.paid_by_profile.id] || txn.paid_by_profile.name
        : txn.profiles
        ? ctx.nicknameMap[txn.created_by ?? ""] || txn.profiles.name
        : "";
      return [
        txn.transaction_date ?? "",
        typeLabel,
        category,
        String(txn.amount),
        txn.title,
        payer,
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", deleteTargetId);
    if (error) {
      toast.error("거래 삭제에 실패했습니다");
    } else {
      toast.success("거래가 삭제되었습니다");
      refetch();
    }
    setDeleteTargetId(null);
  };

  return (
    <>
      <IndependentToggle ctx={ctx} feature="finance" featureLabel="회비" />

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium">회비 관리</h2>
        {isManager && (
          <div className="flex gap-1">
            <FinanceCategoryManager
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              onSuccess={refetch}
            />
            {ctx.features.financePermissionManager &&
              ctx.permissions.canEdit &&
              groupMembers && (
                <FinancePermissionManager
                  groupId={ctx.groupId}
                  members={groupMembers}
                  onSuccess={refetch}
                />
              )}
            <FinanceTransactionForm
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              members={memberOptions}
              onSuccess={refetch}
            />
          </div>
        )}
        {!isManager && canManage && (
          <div className="flex gap-1.5">
            <FinanceCategoryManager
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              onSuccess={refetch}
            />
            <FinanceTransactionForm
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              members={memberOptions}
              onSuccess={refetch}
            />
          </div>
        )}
      </div>

      {/* 전체 통계 (항상 전체 기준) */}
      <FinanceStats
        totalIncome={stats.totalIncome}
        totalExpense={stats.totalExpense}
        balance={stats.balance}
        byCategory={stats.byCategory}
      />

      {/* 거래 내역 / 납부 현황 / 예산 탭 */}
      <div className="mt-3">
        <Tabs defaultValue="transactions">
          <TabsList className="w-full h-7 mb-3">
            <TabsTrigger value="transactions" className="flex-1 text-xs">
              거래 내역
            </TabsTrigger>
            <TabsTrigger value="payment-status" className="flex-1 text-xs">
              납부 현황
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex-1 text-xs">
              예산
            </TabsTrigger>
          </TabsList>

          {/* 거래 내역 탭 */}
          <TabsContent value="transactions" className="mt-0">
            {/* 헤더: 제목 + 월 필터 드롭다운 + CSV 다운로드 */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-muted-foreground">거래 내역</h2>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 gap-1"
                  onClick={handleDownloadCsv}
                  disabled={filteredTransactions.length === 0}
                >
                  <Download className="h-3 w-3" />
                  CSV 다운로드
                </Button>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-6 w-28 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {monthOptions.map((ym) => (
                      <SelectItem key={ym} value={ym}>
                        {formatMonthLabel(ym)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 월별 요약 카드 (전체가 아닌 경우) */}
            {selectedMonth !== "all" && (
              <div className="grid grid-cols-3 gap-2 mb-3">
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
                {selectedMonth === "all"
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
                          txn.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
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
                                {ctx.nicknameMap[txn.paid_by_profile.id] ||
                                  txn.paid_by_profile.name}
                              </span>
                              <span className="text-muted-foreground/40">납부</span>
                            </>
                          ) : txn.profiles ? (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span>
                                {(txn.created_by &&
                                  ctx.nicknameMap[txn.created_by]) ||
                                  txn.profiles.name}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {txn.projects && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 font-normal"
                        >
                          {txn.projects.name}
                        </Badge>
                      )}
                      {txn.finance_categories && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal"
                        >
                          {txn.finance_categories.name}
                        </Badge>
                      )}
                      {(isManager || canManage) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingTxn(txn)}
                            aria-label="거래 수정"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTargetId(txn.id)}
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
          </TabsContent>

          {/* 납부 현황 탭 */}
          <TabsContent value="payment-status" className="mt-0">
            <FinancePaymentStatus
              transactions={transactions}
              members={ctx.members}
              nicknameMap={ctx.nicknameMap}
            />
          </TabsContent>

          {/* 예산 탭 */}
          <TabsContent value="budget" className="mt-0">
            <FinanceBudgetTab
              ctx={ctx}
              canManage={canManage}
              transactions={transactions}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 거래 수정 폼 */}
      {editingTxn && (
        <FinanceTransactionForm
          mode="edit"
          groupId={ctx.groupId}
          projectId={ctx.projectId}
          categories={categories}
          members={memberOptions}
          initialData={editingTxn}
          open={!!editingTxn}
          onOpenChange={(open) => {
            if (!open) setEditingTxn(null);
          }}
          onSuccess={() => {
            setEditingTxn(null);
            refetch();
          }}
        />
      )}

      {/* 거래 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="거래 삭제"
        description="이 거래를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </>
  );
}
