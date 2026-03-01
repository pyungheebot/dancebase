"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, BellRing, CheckCheck, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { createNotification } from "@/lib/notifications";
import { useUnpaidMembers } from "@/hooks/use-unpaid-members";

type Props = {
  groupId: string;
  projectId?: string | null;
  groupName: string;
};

// 일수 기준 심각도 계산
type SeverityLevel = "warning" | "caution" | "critical";

function getSeverity(daysOverdue: number): SeverityLevel {
  if (daysOverdue >= 30) return "critical";
  if (daysOverdue >= 14) return "caution";
  return "warning";
}

function SeverityBadge({ daysOverdue }: { daysOverdue: number }) {
  const severity = getSeverity(daysOverdue);

  if (severity === "critical") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40">
        심각
      </Badge>
    );
  }
  if (severity === "caution") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/40">
        주의
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800/40">
      경고
    </Badge>
  );
}

export function PaymentReminderSection({ groupId, projectId, groupName }: Props) {
  const { unpaidMembers, loading } = useUnpaidMembers(groupId, projectId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

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

  const handleSelectAll = () => {
    if (selectedIds.size === unpaidMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaidMembers.map((m) => m.userId)));
    }
  };

  const handleSendReminders = async () => {
    if (selectedIds.size === 0) {
      toast.error(TOAST.FINANCE.REMINDER_MEMBER_SELECT);
      return;
    }

    setSending(true);
    const targets = unpaidMembers.filter((m) => selectedIds.has(m.userId));
    let successCount = 0;
    let failCount = 0;
    const newlySent = new Set<string>();

    for (const target of targets) {
      try {
        const amountText =
          target.totalUnpaidAmount > 0
            ? ` (약 ${target.totalUnpaidAmount.toLocaleString("ko-KR")}원)`
            : "";
        const monthsText =
          target.unpaidCount === 1
            ? `${target.unpaidCount}개월`
            : `${target.unpaidCount}개월`;

        await createNotification({
          userId: target.userId,
          type: "finance_unpaid",
          title: "미납 회비 독촉 알림",
          message: `[${groupName}] ${monthsText} 동안 회비가 미납 상태입니다${amountText}. 빠른 납부 부탁드립니다.`,
          link: `/groups/${groupId}/finance`,
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
      toast.success(`${successCount}명에게 독촉 알림을 발송했습니다`);
    } else if (successCount > 0) {
      toast.success(`${successCount}명 발송 완료 (${failCount}명 실패)`);
    } else {
      toast.error(TOAST.FINANCE.REMINDER_SEND_ERROR);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-xs text-muted-foreground">미납 멤버 조회 중...</p>
        </CardContent>
      </Card>
    );
  }

  // 미납 멤버 없음
  if (unpaidMembers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">미납 멤버가 없습니다</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            납부자가 지정된 수입 거래가 있어야 집계됩니다
          </p>
        </CardContent>
      </Card>
    );
  }

  const allSelected =
    selectedIds.size === unpaidMembers.length && unpaidMembers.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm">독촉 알림 발송</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40"
          >
            미납 {unpaidMembers.length}명
          </Badge>
        </div>
        <CardDescription className="text-[11px]">
          미납 기간에 따라 심각도가 표시됩니다. 선택 후 알림을 발송하세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 전체 선택 + 알림 발송 버튼 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Checkbox checked={allSelected} className="h-3.5 w-3.5" />
            전체 선택
            {selectedIds.size > 0 && (
              <span className="text-blue-600 font-medium ml-1">
                {selectedIds.size}명 선택됨
              </span>
            )}
          </button>

          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleSendReminders}
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
                독촉 알림 보내기
                {selectedIds.size > 0 && ` (${selectedIds.size})`}
              </>
            )}
          </Button>
        </div>

        {/* 미납 멤버 목록 */}
        <div className="rounded-lg border divide-y">
          {unpaidMembers.map((member) => {
            const isSelected = selectedIds.has(member.userId);
            const wasSent = sentIds.has(member.userId);

            return (
              <div
                key={member.userId}
                className={`flex items-center justify-between px-3 py-2 transition-colors cursor-pointer hover:bg-muted/30 ${
                  isSelected ? "bg-blue-50/60 dark:bg-blue-950/10" : ""
                }`}
                onClick={() => toggleSelect(member.userId)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(member.userId)}
                    className="h-3.5 w-3.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">
                        {member.name}
                      </span>
                      {wasSent && (
                        <CheckCheck className="h-3 w-3 text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {member.unpaidCount}개월 미납
                      {member.totalUnpaidAmount > 0 &&
                        ` · 약 ${member.totalUnpaidAmount.toLocaleString("ko-KR")}원`}
                      {` · ${member.daysOverdue}일 경과`}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <SeverityBadge daysOverdue={member.daysOverdue} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 심각도 기준 안내 */}
        <div className="flex items-center gap-3 pt-1">
          <p className="text-[10px] text-muted-foreground shrink-0">심각도 기준:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Badge className="text-[9px] px-1 py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-200">
                경고
              </Badge>
              <span className="text-[10px] text-muted-foreground">7일 이내</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="text-[9px] px-1 py-0 h-4 bg-orange-100 text-orange-700 border-orange-200">
                주의
              </Badge>
              <span className="text-[10px] text-muted-foreground">14일 이상</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="text-[9px] px-1 py-0 h-4 bg-red-100 text-red-700 border-red-200">
                심각
              </Badge>
              <span className="text-[10px] text-muted-foreground">30일 이상</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
