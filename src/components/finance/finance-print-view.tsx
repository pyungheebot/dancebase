"use client";

import type { FinanceTransactionWithDetails } from "@/types";
import {
  PrintLayout,
  PrintSummaryCard,
  thStyle,
  tdStyle,
} from "@/components/shared/print-layout";
import { formatYearMonthDay } from "@/lib/date-utils";

type Props = {
  transactions: FinanceTransactionWithDetails[];
  groupName: string;
  periodLabel: string;
  nicknameMap: Record<string, string>;
};

const FINANCE_EXTRA_PRINT_CSS = `
  .finance-print-area thead {
    display: table-header-group;
  }
  .finance-print-area tr {
    break-inside: avoid;
  }
`;

export function FinancePrintView({
  transactions,
  groupName,
  periodLabel,
  nicknameMap,
}: Props) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const generatedAt = formatYearMonthDay(new Date());

  return (
    <PrintLayout
      title="회비 정산 보고서"
      groupName={groupName}
      periodLabel={periodLabel}
      generatedAt={generatedAt}
      printAreaClass="finance-print-area"
      extraPrintCss={FINANCE_EXTRA_PRINT_CSS}
    >
      {/* 요약 통계 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <PrintSummaryCard
          label="총 수입"
          value={`+${totalIncome.toLocaleString("ko-KR")}원`}
          valueColor="#16a34a"
        />
        <PrintSummaryCard
          label="총 지출"
          value={`-${totalExpense.toLocaleString("ko-KR")}원`}
          valueColor="#ef4444"
        />
        <PrintSummaryCard
          label="잔액"
          value={`${balance >= 0 ? "+" : ""}${balance.toLocaleString("ko-KR")}원`}
          valueColor={balance >= 0 ? "#2563eb" : "#ef4444"}
        />
      </div>

      {/* 거래 내역 테이블 */}
      <h2
        style={{
          fontSize: "13px",
          fontWeight: "600",
          marginBottom: "8px",
          borderLeft: "3px solid #000",
          paddingLeft: "8px",
        }}
      >
        거래 내역 ({transactions.length}건)
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={thStyle({ width: "80px", textAlign: "center" })}>
              날짜
            </th>
            <th style={thStyle({ width: "60px", textAlign: "center" })}>
              카테고리
            </th>
            <th style={thStyle({ textAlign: "left" })}>제목</th>
            <th style={thStyle({ width: "90px", textAlign: "right" })}>
              수입
            </th>
            <th style={thStyle({ width: "90px", textAlign: "right" })}>
              지출
            </th>
            <th style={thStyle({ width: "70px", textAlign: "center" })}>
              담당자
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn, idx) => {
            const payerName = txn.paid_by_profile
              ? nicknameMap[txn.paid_by_profile.id] || txn.paid_by_profile.name
              : txn.profiles
              ? nicknameMap[txn.created_by ?? ""] || txn.profiles.name
              : "";
            return (
              <tr
                key={txn.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <td style={tdStyle({ textAlign: "center", color: "#6b7280" })}>
                  {txn.transaction_date ?? ""}
                </td>
                <td style={tdStyle({ textAlign: "center" })}>
                  {txn.finance_categories?.name ?? "-"}
                </td>
                <td style={tdStyle({})}>{txn.title}</td>
                <td
                  style={tdStyle({
                    textAlign: "right",
                    color: txn.type === "income" ? "#16a34a" : "transparent",
                    fontWeight: txn.type === "income" ? "600" : "400",
                  })}
                >
                  {txn.type === "income"
                    ? `+${txn.amount.toLocaleString("ko-KR")}`
                    : ""}
                </td>
                <td
                  style={tdStyle({
                    textAlign: "right",
                    color: txn.type === "expense" ? "#ef4444" : "transparent",
                    fontWeight: txn.type === "expense" ? "600" : "400",
                  })}
                >
                  {txn.type === "expense"
                    ? `-${txn.amount.toLocaleString("ko-KR")}`
                    : ""}
                </td>
                <td style={tdStyle({ textAlign: "center", color: "#6b7280" })}>
                  {payerName}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr
            style={{
              borderTop: "2px solid #d1d5db",
              backgroundColor: "#f3f4f6",
            }}
          >
            <td colSpan={3} style={tdStyle({ fontWeight: "600" })}>
              합계
            </td>
            <td
              style={tdStyle({
                textAlign: "right",
                fontWeight: "700",
                color: "#16a34a",
              })}
            >
              +{totalIncome.toLocaleString("ko-KR")}
            </td>
            <td
              style={tdStyle({
                textAlign: "right",
                fontWeight: "700",
                color: "#ef4444",
              })}
            >
              -{totalExpense.toLocaleString("ko-KR")}
            </td>
            <td style={tdStyle({})} />
          </tr>
        </tfoot>
      </table>
    </PrintLayout>
  );
}
