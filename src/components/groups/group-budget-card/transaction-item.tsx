"use client";

import { memo } from "react";
import { Calendar, User, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMonthDay } from "@/lib/date-utils";
import type { GroupBudgetTransaction, GroupBudgetCategory } from "@/types";
import { formatAmount } from "./types";

// ============================================================
// Props
// ============================================================

export type TransactionItemProps = {
  tx: GroupBudgetTransaction;
  categories: GroupBudgetCategory[];
  onEdit: (tx: GroupBudgetTransaction) => void;
  onDelete: (txId: string) => void;
};

// ============================================================
// 컴포넌트 (React.memo로 불필요한 리렌더 방지)
// ============================================================

export const TransactionItem = memo(function TransactionItem({
  tx,
  categories,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const catDef = categories.find((c) => c.name === tx.category);
  const isIncome = tx.type === "income";
  const amountLabel = `${isIncome ? "수입" : "지출"} ${formatAmount(tx.amount)}`;

  return (
    <li
      role="listitem"
      className="group flex items-start justify-between rounded-md border px-2.5 py-2 hover:bg-muted/40"
      aria-label={`${tx.description}, ${tx.category}, ${amountLabel}, ${formatMonthDay(tx.date)}`}
    >
      <div className="flex items-start gap-2 overflow-hidden">
        <span className="mt-0.5 text-base leading-none" aria-hidden="true">
          {catDef?.icon ?? "💸"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{tx.description}</p>
          <div
            className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground"
            aria-hidden="true"
          >
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {formatMonthDay(tx.date)}
            </span>
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              {tx.category}
            </Badge>
            {tx.paidBy && (
              <span className="flex items-center gap-0.5">
                <User className="h-2.5 w-2.5" />
                {tx.paidBy}
              </span>
            )}
            {tx.receiptNote && (
              <span className="flex items-center gap-0.5" title={tx.receiptNote}>
                <FileText className="h-2.5 w-2.5" />
                메모
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "text-xs font-semibold",
            isIncome
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
          aria-label={amountLabel}
        >
          {isIncome ? "+" : "-"}
          {formatAmount(tx.amount)}
        </span>
        <div
          className="hidden items-center gap-0.5 group-hover:flex"
          role="group"
          aria-label="거래 액션"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(tx)}
            aria-label={`${tx.description} 수정`}
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(tx.id)}
            aria-label={`${tx.description} 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
});
