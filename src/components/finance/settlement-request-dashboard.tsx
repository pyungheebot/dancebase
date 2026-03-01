"use client";

import { useState, memo } from "react";
import {
  useSettlementRequests,
  type SettlementRequestWithDetails,
} from "@/hooks/use-settlement-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, Bell, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { SettlementMemberStatus } from "@/types";

type Props = {
  groupId: string;
  nicknameMap: Record<string, string>;
};

function statusLabel(status: SettlementMemberStatus) {
  if (status === "confirmed") return "확인됨";
  if (status === "paid_pending") return "납부 대기";
  return "미납";
}

function StatusBadge({ status }: { status: SettlementMemberStatus }) {
  const cls =
    status === "confirmed"
      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40"
      : status === "paid_pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/40"
      : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-900/40";
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cls}`}>
      {statusLabel(status)}
    </Badge>
  );
}

function DdayBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const diff = differenceInCalendarDays(parseISO(dueDate), new Date());
  const label = diff === 0 ? "오늘 마감" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  const cls =
    diff < 0
      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
      : diff === 0
      ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40"
      : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40";
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cls}`}>
      {label}
    </Badge>
  );
}

type SettlementMemberItem = {
  id: string;
  user_id: string;
  status: SettlementMemberStatus;
  profiles?: { name: string } | null;
};

type SettlementMemberCardProps = {
  member: SettlementMemberItem;
  name: string;
  requestStatus: "active" | "closed";
  confirmingId: string | null;
  onConfirm: (memberId: string) => void;
};

const SettlementMemberCard = memo(function SettlementMemberCard({
  member,
  name,
  requestStatus,
  confirmingId,
  onConfirm,
}: SettlementMemberCardProps) {
  const isConfirming = confirmingId === member.id;
  return (
    <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-muted/30">
      <div className="flex items-center gap-1.5">
        {member.status === "confirmed" ? (
          <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
        ) : member.status === "paid_pending" ? (
          <Clock className="h-3 w-3 text-yellow-600 shrink-0" />
        ) : (
          <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs">{name}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusBadge status={member.status} />
        {member.status === "paid_pending" && requestStatus === "active" && (
          <Button
            size="sm"
            className="h-5 text-[10px] px-1.5"
            onClick={() => onConfirm(member.id)}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : null}
            납부 확인
          </Button>
        )}
      </div>
    </div>
  );
});

function RequestCard({
  request,
  nicknameMap,
  onConfirm,
  onClose,
  onReminder,
}: {
  request: SettlementRequestWithDetails;
  nicknameMap: Record<string, string>;
  onConfirm: (memberId: string) => Promise<void>;
  onClose: (requestId: string) => Promise<void>;
  onReminder: (requestId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [reminding, setReminding] = useState(false);

  const members = request.settlement_request_members;
  const confirmedCount = members.filter((m) => m.status === "confirmed").length;
  const paidPendingCount = members.filter((m) => m.status === "paid_pending").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  async function handleConfirm(memberId: string) {
    setConfirmingId(memberId);
    await onConfirm(memberId);
    setConfirmingId(null);
  }

  async function handleClose() {
    setClosing(true);
    await onClose(request.id);
    setClosing(false);
  }

  async function handleReminder() {
    setReminding(true);
    await onReminder(request.id);
    setReminding(false);
  }

  return (
    <Card className="text-xs">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CardTitle className="text-xs font-medium">{request.title}</CardTitle>
              {request.status === "closed" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  종료
                </Badge>
              )}
              <DdayBadge dueDate={request.due_date} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {request.amount.toLocaleString("ko-KR")}원 · {confirmedCount}/{members.length}명 확인
              {paidPendingCount > 0 && ` · ${paidPendingCount}명 납부 대기`}
              {pendingCount > 0 && ` · ${pendingCount}명 미납`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {request.status === "active" && (
              <>
                {pendingCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-1.5 gap-0.5"
                    onClick={handleReminder}
                    disabled={reminding}
                  >
                    {reminding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Bell className="h-3 w-3" />
                    )}
                    리마인더
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-1.5"
                  onClick={handleClose}
                  disabled={closing}
                >
                  {closing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  종료
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "접기" : "펼치기"}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="px-3 pb-3 pt-0 space-y-1">
          {request.memo && (
            <p className="text-[11px] text-muted-foreground mb-2 bg-muted/40 rounded px-2 py-1">
              {request.memo}
            </p>
          )}
          {members.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              대상 멤버가 없습니다
            </p>
          ) : (
            members.map((member) => (
              <SettlementMemberCard
                key={member.id}
                member={member}
                name={nicknameMap[member.user_id] || member.profiles?.name || member.user_id}
                requestStatus={request.status}
                confirmingId={confirmingId}
                onConfirm={handleConfirm}
              />
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function SettlementRequestDashboard({ groupId, nicknameMap }: Props) {
  const { settlementRequests, loading, confirmPayment, closeRequest, sendReminder } =
    useSettlementRequests(groupId);

  const [showClosed, setShowClosed] = useState(false);

  async function handleConfirm(memberId: string) {
    const { error } = await confirmPayment(memberId);
    if (error) {
      toast.error("납부 확인에 실패했습니다");
    } else {
      toast.success("납부가 확인되었습니다");
    }
  }

  async function handleClose(requestId: string) {
    const { error } = await closeRequest(requestId);
    if (error) {
      toast.error("정산 요청 종료에 실패했습니다");
    } else {
      toast.success("정산 요청이 종료되었습니다");
    }
  }

  async function handleReminder(requestId: string) {
    const { error } = await sendReminder(requestId);
    if (error) {
      toast.error("리마인더 발송에 실패했습니다");
    } else {
      toast.success("리마인더가 발송되었습니다");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeRequests = settlementRequests.filter((r) => r.status === "active");
  const closedRequests = settlementRequests.filter((r) => r.status === "closed");

  return (
    <div className="space-y-3">
      {activeRequests.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          진행 중인 정산 요청이 없습니다
        </p>
      )}

      {activeRequests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          nicknameMap={nicknameMap}
          onConfirm={handleConfirm}
          onClose={handleClose}
          onReminder={handleReminder}
        />
      ))}

      {closedRequests.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-muted-foreground gap-1 px-1"
            onClick={() => setShowClosed((v) => !v)}
          >
            {showClosed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            종료된 요청 {closedRequests.length}건
          </Button>

          {showClosed && (
            <div className="mt-2 space-y-2">
              {closedRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  nicknameMap={nicknameMap}
                  onConfirm={handleConfirm}
                  onClose={handleClose}
                  onReminder={handleReminder}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
