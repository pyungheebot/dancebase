"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, AlertTriangle, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMonths, parseISO } from "date-fns";
import { createNotification } from "@/lib/notifications";
import type { FinanceTransactionWithDetails } from "@/types";
import type { EntityMember } from "@/types/entity-context";

type Props = {
  transactions: FinanceTransactionWithDetails[];
  members: EntityMember[];
  nicknameMap: Record<string, string>;
  groupId: string;
  groupName: string;
  canManageFinance: boolean;
};

type UnpaidMemberEntry = {
  userId: string;
  name: string;
  unpaidMonths: string[]; // "YYYY-MM" 배열
  unpaidAmount: number;
  monthsOverdue: number; // 현재 기준 가장 오래된 미납 기간(월)
};

// 미납 기간 분류
type OverdueCategory = "1month" | "3month_plus";

function getOverdueCategory(monthsOverdue: number): OverdueCategory {
  if (monthsOverdue >= 3) return "3month_plus";
  return "1month";
}

function getOverdueBadge(monthsOverdue: number) {
  if (monthsOverdue >= 3) {
    return (
      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40">
        {monthsOverdue}개월 미납
      </Badge>
    );
  }
  return (
    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/40">
      {monthsOverdue}개월 미납
    </Badge>
  );
}

export function DelinquencyWorkflow({
  transactions,
  members,
  nicknameMap,
  groupId: _groupId,
  groupName,
  canManageFinance,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const today = format(new Date(), "yyyy-MM");

  // paid_by 기준으로 월별 납부자 집합 계산
  const paidByMonth = useMemo(() => {
    const map: Record<string, Set<string>> = {}; // month -> Set<userId>
    transactions.forEach((txn) => {
      if (txn.type === "income" && txn.paid_by && txn.transaction_date) {
        const month = txn.transaction_date.slice(0, 7);
        if (!map[month]) map[month] = new Set();
        map[month].add(txn.paid_by);
      }
    });
    return map;
  }, [transactions]);

  // 납부자 데이터가 존재하는 월 목록 (오름차순)
  const activeMonths = useMemo(() => {
    return Object.keys(paidByMonth).sort();
  }, [paidByMonth]);

  // 멤버별 미납 집계
  const unpaidMembers = useMemo((): UnpaidMemberEntry[] => {
    if (activeMonths.length === 0) return [];

    return members
      .map((member) => {
        const unpaidMonths: string[] = [];

        activeMonths.forEach((month) => {
          const paidSet = paidByMonth[month];
          if (paidSet && !paidSet.has(member.userId)) {
            unpaidMonths.push(month);
          }
        });

        if (unpaidMonths.length === 0) return null;

        // 미납 금액: 해당 월에 paid_by가 있는 수입 거래들의 평균 또는 합산
        // 미납 월별 다른 사람이 납부한 금액의 평균으로 추정
        let unpaidAmount = 0;
        unpaidMonths.forEach((month) => {
          const monthTxns = transactions.filter(
            (txn) =>
              txn.type === "income" &&
              txn.paid_by &&
              txn.transaction_date?.startsWith(month)
          );
          if (monthTxns.length > 0) {
            // 해당 월 납부 금액 중 가장 일반적인 금액(최빈값 대신 단순 첫 거래 금액 사용)
            const uniqueAmounts = monthTxns.map((t) => t.amount);
            const avgAmount =
              uniqueAmounts.reduce((s, a) => s + a, 0) / uniqueAmounts.length;
            unpaidAmount += Math.round(avgAmount);
          }
        });

        // 가장 오래된 미납 월로부터 현재까지 경과 월 수
        const oldestMonth = unpaidMonths[0];
        let monthsOverdue = 0;
        try {
          monthsOverdue = differenceInMonths(
            parseISO(today + "-01"),
            parseISO(oldestMonth + "-01")
          );
          // 최소 1개월
          if (monthsOverdue < 1) monthsOverdue = 1;
        } catch {
          monthsOverdue = unpaidMonths.length;
        }

        return {
          userId: member.userId,
          name: nicknameMap[member.userId] || member.profile.name,
          unpaidMonths,
          unpaidAmount,
          monthsOverdue,
        } satisfies UnpaidMemberEntry;
      })
      .filter((entry): entry is UnpaidMemberEntry => entry !== null)
      .sort((a, b) => b.monthsOverdue - a.monthsOverdue);
  }, [members, paidByMonth, activeMonths, transactions, nicknameMap, today]);

  // 1개월 미납 / 3개월 초과 분리
  const threeMonthPlus = unpaidMembers.filter(
    (m) => getOverdueCategory(m.monthsOverdue) === "3month_plus"
  );
  const oneMonth = unpaidMembers.filter(
    (m) => getOverdueCategory(m.monthsOverdue) === "1month"
  );

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectGroup = (userIds: string[]) => {
    const allSelected = userIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        userIds.forEach((id) => next.delete(id));
      } else {
        userIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === unpaidMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaidMembers.map((m) => m.userId)));
    }
  };

  const handleSendNotifications = async () => {
    if (selectedIds.size === 0) {
      toast.error("알림을 보낼 멤버를 선택해주세요");
      return;
    }

    setSending(true);
    const targets = unpaidMembers.filter((m) => selectedIds.has(m.userId));
    let successCount = 0;
    let failCount = 0;
    const newlySent = new Set<string>();

    for (const target of targets) {
      try {
        const monthsText =
          target.unpaidMonths.length === 1
            ? target.unpaidMonths[0]
            : `${target.unpaidMonths[0]} 외 ${target.unpaidMonths.length - 1}개월`;

        await createNotification({
          userId: target.userId,
          type: "finance_unpaid",
          title: "미납 회비 알림",
          message: `[${groupName}] ${monthsText} 회비가 미납 상태입니다. 빠른 납부 부탁드립니다.`,
          link: `/groups/${_groupId}/finance`,
        });

        newlySent.add(target.userId);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSentIds((prev) => new Set([...prev, ...newlySent]));
    setSelectedIds(new Set());
    setSending(false);

    if (failCount === 0) {
      toast.success(
        `${successCount}명에게 미납 알림을 발송했습니다`
      );
    } else if (successCount > 0) {
      toast.success(
        `${successCount}명 발송 완료 (${failCount}명 실패)`
      );
    } else {
      toast.error("알림 발송에 실패했습니다");
    }
  };

  if (unpaidMembers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-xs text-muted-foreground">미납 멤버가 없습니다</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          납부자가 지정된 수입 거래가 있을 때 집계됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 헤더 + 전체 선택 + 알림 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Checkbox
              checked={
                selectedIds.size === unpaidMembers.length &&
                unpaidMembers.length > 0
              }
              className="h-3.5 w-3.5"
            />
            전체 선택
          </button>
          {selectedIds.size > 0 && (
            <span className="text-[11px] text-blue-600 font-medium">
              {selectedIds.size}명 선택됨
            </span>
          )}
        </div>

        {canManageFinance && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleSendNotifications}
            disabled={sending || selectedIds.size === 0}
          >
            {sending ? (
              <>
                <BellRing className="h-3 w-3 animate-pulse" />
                발송 중...
              </>
            ) : (
              <>
                <Bell className="h-3 w-3" />
                알림 보내기 {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </>
            )}
          </Button>
        )}
      </div>

      {/* 3개월 초과 미납 그룹 */}
      {threeMonthPlus.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                3개월 초과 미납 ({threeMonthPlus.length}명)
              </span>
            </div>
            {canManageFinance && (
              <button
                onClick={() =>
                  toggleSelectGroup(threeMonthPlus.map((m) => m.userId))
                }
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                그룹 선택
              </button>
            )}
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-900/40 divide-y divide-red-100 dark:divide-red-900/20 overflow-hidden">
            {threeMonthPlus.map((member) => (
              <UnpaidMemberRow
                key={member.userId}
                member={member}
                selected={selectedIds.has(member.userId)}
                onToggle={() => toggleSelect(member.userId)}
                wasSent={sentIds.has(member.userId)}
                canManage={canManageFinance}
              />
            ))}
          </div>
        </div>
      )}

      {/* 1개월 미납 그룹 */}
      {oneMonth.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                1~2개월 미납 ({oneMonth.length}명)
              </span>
            </div>
            {canManageFinance && (
              <button
                onClick={() =>
                  toggleSelectGroup(oneMonth.map((m) => m.userId))
                }
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                그룹 선택
              </button>
            )}
          </div>
          <div className="rounded-lg border border-orange-200 dark:border-orange-900/40 divide-y divide-orange-100 dark:divide-orange-900/20 overflow-hidden">
            {oneMonth.map((member) => (
              <UnpaidMemberRow
                key={member.userId}
                member={member}
                selected={selectedIds.has(member.userId)}
                onToggle={() => toggleSelect(member.userId)}
                wasSent={sentIds.has(member.userId)}
                canManage={canManageFinance}
              />
            ))}
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <p className="text-[10px] text-muted-foreground">
        * 납부자가 지정된 수입 거래를 기준으로 집계됩니다
      </p>
    </div>
  );
}

// 미납 멤버 행 컴포넌트
function UnpaidMemberRow({
  member,
  selected,
  onToggle,
  wasSent,
  canManage,
}: {
  member: UnpaidMemberEntry;
  selected: boolean;
  onToggle: () => void;
  wasSent: boolean;
  canManage: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 bg-white/60 dark:bg-background/20 ${
        selected ? "bg-blue-50/60 dark:bg-blue-950/10" : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {canManage && (
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            className="h-3.5 w-3.5 shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{member.name}</span>
            {wasSent && (
              <CheckCheck className="h-3 w-3 text-green-500 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {member.unpaidMonths.length}개월 미납
            {member.unpaidAmount > 0 &&
              ` · 약 ${member.unpaidAmount.toLocaleString("ko-KR")}원`}
          </p>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {getOverdueBadge(member.monthsOverdue)}
      </div>
    </div>
  );
}
