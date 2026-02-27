"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FinanceTransactionForm } from "@/components/groups/finance-transaction-form";
import { FinanceCategoryManager } from "@/components/groups/finance-category-manager";
import { FinancePermissionManager } from "@/components/groups/finance-permission-manager";
import { FinanceStats } from "@/components/groups/finance-stats";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

  const isManager = financeRole === "manager";
  const canManage = isManager || ctx.permissions.canEdit;

  const handleDelete = async (txnId: string) => {
    if (!window.confirm("이 거래를 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", txnId);
    if (error) {
      toast.error("거래 삭제에 실패했습니다");
      return;
    }
    refetch();
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
              onSuccess={refetch}
            />
          </div>
        )}
      </div>

      <FinanceStats
        totalIncome={stats.totalIncome}
        totalExpense={stats.totalExpense}
        balance={stats.balance}
        byCategory={stats.byCategory}
      />

      <div className="mt-3">
        <h2 className="text-xs font-medium text-muted-foreground mb-1.5">
          거래 내역
        </h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            거래 내역이 없습니다
          </p>
        ) : (
          <div className="rounded-lg border divide-y">
            {transactions.map((txn) => (
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
                      {txn.profiles && (
                        <>
                          <span className="text-muted-foreground/40">
                            ·
                          </span>
                          <span>
                            {(txn.created_by &&
                              ctx.nicknameMap[txn.created_by]) ||
                              txn.profiles.name}
                          </span>
                        </>
                      )}
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
                        onClick={() => handleDelete(txn.id)}
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

      {editingTxn && (
        <FinanceTransactionForm
          mode="edit"
          groupId={ctx.groupId}
          projectId={ctx.projectId}
          categories={categories}
          initialData={editingTxn}
          open={!!editingTxn}
          onOpenChange={(open) => { if (!open) setEditingTxn(null); }}
          onSuccess={() => {
            setEditingTxn(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
