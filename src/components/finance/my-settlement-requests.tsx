"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { SettlementMemberStatus } from "@/types";

type Props = {
  groupId: string;
};

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

function statusLabel(status: SettlementMemberStatus) {
  if (status === "confirmed") return "납부 확인됨";
  if (status === "paid_pending") return "납부 완료 (확인 대기)";
  return "미납";
}

function MyRequestCard({
  request,
  myMemberId,
  myStatus,
  onMarkPaid,
}: {
  request: SettlementRequestWithDetails;
  myMemberId: string;
  myStatus: SettlementMemberStatus;
  onMarkPaid: (memberId: string) => Promise<void>;
}) {
  const [paying, setPaying] = useState(false);
  const paymentMethod = request.group_payment_methods;

  async function handleMarkPaid() {
    setPaying(true);
    await onMarkPaid(myMemberId);
    setPaying(false);
  }

  async function copyAccountNumber(text: string) {
    await copyToClipboard(text, "계좌번호가 복사되었습니다", "복사에 실패했습니다");
  }

  const isActive = request.status === "active";
  const canPay = isActive && myStatus === "pending";

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
              {myStatus === "confirmed" && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  확인됨
                </Badge>
              )}
              {myStatus === "paid_pending" && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/40"
                >
                  납부 대기 중
                </Badge>
              )}
              <DdayBadge dueDate={request.due_date} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {request.amount.toLocaleString("ko-KR")}원 · {statusLabel(myStatus)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        {request.memo && (
          <p className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1">
            {request.memo}
          </p>
        )}

        {/* 결제 수단 안내 */}
        {paymentMethod && (
          <div className="rounded-md border px-3 py-2 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              송금 방법: {paymentMethod.label}
            </p>

            {paymentMethod.type === "bank" && paymentMethod.account_number && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">
                    {paymentMethod.bank_name} {paymentMethod.account_number}
                  </p>
                  {paymentMethod.account_holder && (
                    <p className="text-[11px] text-muted-foreground">
                      예금주: {paymentMethod.account_holder}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-1.5 gap-0.5 shrink-0"
                  onClick={() =>
                    copyAccountNumber(
                      `${paymentMethod.bank_name} ${paymentMethod.account_number}`
                    )
                  }
                >
                  <Copy className="h-3 w-3" />
                  복사
                </Button>
              </div>
            )}

            {paymentMethod.type === "toss" && paymentMethod.toss_id && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{paymentMethod.toss_id}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-1.5 gap-0.5 shrink-0"
                  asChild
                >
                  <a
                    href={`https://toss.me/${paymentMethod.toss_id.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    송금하기
                  </a>
                </Button>
              </div>
            )}

            {paymentMethod.type === "kakao" && paymentMethod.kakao_link && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">카카오페이</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-1.5 gap-0.5 shrink-0"
                  asChild
                >
                  <a
                    href={paymentMethod.kakao_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    송금하기
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}

        {canPay && (
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleMarkPaid}
            disabled={paying}
          >
            {paying && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            납부 완료 알리기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function MySettlementRequests({ groupId }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { settlementRequests, loading, markAsPaid } = useSettlementRequests(groupId);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      if (res.data.user) setCurrentUserId(res.data.user.id);
    });
  }, []);

  async function handleMarkPaid(memberId: string) {
    const { error } = await markAsPaid(memberId);
    if (error) {
      toast.error("납부 완료 처리에 실패했습니다");
    } else {
      toast.success("납부 완료를 알렸습니다. 리더 확인 후 처리됩니다.");
    }
  }

  if (loading || !currentUserId) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 나의 정산 요청만 필터링
  const myRequests = settlementRequests
    .map((request) => {
      const myMember = request.settlement_request_members.find(
        (m) => m.user_id === currentUserId
      );
      if (!myMember) return null;
      return { request, myMemberId: myMember.id, myStatus: myMember.status };
    })
    .filter(
      (
        item
      ): item is {
        request: SettlementRequestWithDetails;
        myMemberId: string;
        myStatus: SettlementMemberStatus;
      } => item !== null
    );

  const activeRequests = myRequests.filter((r) => r.request.status === "active");
  const closedRequests = myRequests.filter((r) => r.request.status === "closed");

  return (
    <div className="space-y-3">
      {activeRequests.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          진행 중인 정산 요청이 없습니다
        </p>
      )}

      {activeRequests.map(({ request, myMemberId, myStatus }) => (
        <MyRequestCard
          key={request.id}
          request={request}
          myMemberId={myMemberId}
          myStatus={myStatus}
          onMarkPaid={handleMarkPaid}
        />
      ))}

      {closedRequests.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] text-muted-foreground mb-2">종료된 요청</p>
          <div className="space-y-2">
            {closedRequests.map(({ request, myMemberId, myStatus }) => (
              <MyRequestCard
                key={request.id}
                request={request}
                myMemberId={myMemberId}
                myStatus={myStatus}
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
