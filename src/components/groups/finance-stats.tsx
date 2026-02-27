"use client";

import type { FinanceCategory } from "@/types";

type CategoryStat = {
  category: FinanceCategory;
  income: number;
  expense: number;
};

type Props = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: CategoryStat[];
};

function fmt(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

export function FinanceStats({ totalIncome, totalExpense, balance, byCategory }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3 text-xs">
        <span className="text-muted-foreground">잔액</span>
        <span className={`text-sm font-semibold tabular-nums ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
          {fmt(balance)}
        </span>
        <span className="text-muted-foreground ml-auto">수입</span>
        <span className="font-medium tabular-nums text-green-600">{fmt(totalIncome)}</span>
        <span className="text-muted-foreground">지출</span>
        <span className="font-medium tabular-nums text-red-600">{fmt(totalExpense)}</span>
      </div>

      {byCategory.length > 0 && (
        <div className="rounded border">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-3 py-1.5 font-medium">카테고리</th>
                <th className="text-right px-3 py-1.5 font-medium">수입</th>
                <th className="text-right px-3 py-1.5 font-medium">지출</th>
                <th className="text-right px-3 py-1.5 font-medium">합계</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((row) => (
                <tr key={row.category.id || "uncategorized"} className="border-b last:border-0">
                  <td className="px-3 py-1.5">{row.category.name}</td>
                  <td className="text-right px-3 py-1.5 tabular-nums text-green-600">
                    {row.income > 0 ? fmt(row.income) : "-"}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums text-red-600">
                    {row.expense > 0 ? fmt(row.expense) : "-"}
                  </td>
                  <td className="text-right px-3 py-1.5 tabular-nums font-medium">
                    {fmt(row.income - row.expense)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
