"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/export/csv-exporter";
import type { FinanceTransactionWithDetails } from "@/types";
import type { EntityMember } from "@/types/entity-context";

type Props = {
  transactions: FinanceTransactionWithDetails[];
  members: EntityMember[];
  nicknameMap: Record<string, string>;
};

// "YYYY-MM" 형식의 월 레이블
function formatMonthLabel(ym: string) {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

// 거래 목록에서 월 옵션 생성
function buildMonthOptions(transactions: FinanceTransactionWithDetails[]) {
  const monthSet = new Set<string>();
  transactions.forEach((txn) => {
    if (txn.transaction_date) {
      monthSet.add(txn.transaction_date.slice(0, 7));
    }
  });
  const now = format(new Date(), "yyyy-MM");
  monthSet.add(now);
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}

export function FinancePaymentStatus({ transactions, members, nicknameMap }: Props) {
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const monthOptions = useMemo(() => buildMonthOptions(transactions), [transactions]);

  // 선택된 월의 수입 거래 중 paid_by가 있는 것만 집계
  const paymentStats = useMemo(() => {
    const monthlyIncome = transactions.filter(
      (txn) =>
        txn.type === "income" &&
        txn.paid_by &&
        txn.transaction_date?.startsWith(selectedMonth)
    );

    // 멤버별 납부 집계
    const paymentMap: Record<
      string,
      { totalAmount: number; count: number }
    > = {};

    monthlyIncome.forEach((txn) => {
      if (!txn.paid_by) return;
      if (!paymentMap[txn.paid_by]) {
        paymentMap[txn.paid_by] = { totalAmount: 0, count: 0 };
      }
      paymentMap[txn.paid_by].totalAmount += txn.amount;
      paymentMap[txn.paid_by].count += 1;
    });

    return paymentMap;
  }, [transactions, selectedMonth]);

  // 멤버별 납부 현황 목록
  const memberPayments = useMemo(() => {
    return members.map((member) => {
      const stats = paymentStats[member.userId];
      const hasPaid = !!stats && stats.count > 0;
      const displayName =
        nicknameMap[member.userId] || member.profile.name;
      return {
        userId: member.userId,
        name: displayName,
        totalAmount: stats?.totalAmount ?? 0,
        count: stats?.count ?? 0,
        hasPaid,
      };
    });
  }, [members, paymentStats, nicknameMap]);

  const paidCount = memberPayments.filter((m) => m.hasPaid).length;
  const unpaidCount = memberPayments.filter((m) => !m.hasPaid).length;
  const totalPaidAmount = memberPayments.reduce(
    (sum, m) => sum + m.totalAmount,
    0
  );

  const handleDownloadCsv = () => {
    const filename = `납부현황_${selectedMonth}.csv`;
    const headers = ["멤버이름", "납부금액", "납부횟수", "상태"];
    const rows = memberPayments.map((member) => [
      member.name,
      String(member.totalAmount),
      String(member.count),
      member.hasPaid ? "납부" : "미납",
    ]);

    exportToCsv(filename, headers, rows);
  };

  return (
    <div className="space-y-3">
      {/* 월 선택 + 요약 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            납부 {paidCount}명 · 미납 {unpaidCount}명
          </span>
          {totalPaidAmount > 0 && (
            <span className="text-[11px] font-medium text-green-600 tabular-nums">
              총 +{totalPaidAmount.toLocaleString("ko-KR")}원
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2 gap-1"
            onClick={handleDownloadCsv}
            disabled={memberPayments.length === 0}
          >
            <Download className="h-3 w-3" />
            CSV 다운로드
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-6 w-28 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((ym) => (
                <SelectItem key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 멤버 납부 현황 테이블 */}
      {memberPayments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          멤버가 없습니다
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 bg-muted/50 border-b">
            <span className="text-[10px] font-medium text-muted-foreground">
              멤버
            </span>
            <span className="text-[10px] font-medium text-muted-foreground text-right">
              납부 금액
            </span>
            <span className="text-[10px] font-medium text-muted-foreground text-right">
              횟수
            </span>
            <span className="text-[10px] font-medium text-muted-foreground text-right">
              상태
            </span>
          </div>

          {/* 행 목록 */}
          <div className="divide-y">
            {memberPayments.map((member) => (
              <div
                key={member.userId}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 items-center ${
                  member.hasPaid ? "" : "bg-red-50/40 dark:bg-red-950/10"
                }`}
              >
                <span
                  className={`text-xs truncate ${
                    member.hasPaid
                      ? "text-foreground"
                      : "text-red-600 dark:text-red-400 font-medium"
                  }`}
                >
                  {member.name}
                </span>
                <span className="text-xs tabular-nums text-right text-muted-foreground">
                  {member.totalAmount > 0
                    ? `${member.totalAmount.toLocaleString("ko-KR")}원`
                    : "-"}
                </span>
                <span className="text-xs tabular-nums text-right text-muted-foreground">
                  {member.count > 0 ? `${member.count}회` : "-"}
                </span>
                <div className="flex justify-end">
                  {member.hasPaid ? (
                    <Badge
                      className="text-[9px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                      variant="outline"
                    >
                      납부
                    </Badge>
                  ) : (
                    <Badge
                      className="text-[9px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                      variant="outline"
                    >
                      미납
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <p className="text-[10px] text-muted-foreground">
        * 수입 거래에 납부자가 지정된 경우에만 집계됩니다
      </p>
    </div>
  );
}
