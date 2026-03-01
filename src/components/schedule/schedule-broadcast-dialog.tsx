"use client";

import { useState } from "react";
import { differenceInDays } from "date-fns";
import { formatKo } from "@/lib/date-utils";
import { Bell, Send, Users, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  useScheduleBroadcast,
  type BroadcastTargetType,
} from "@/hooks/use-schedule-broadcast";
import type { Schedule } from "@/types";

type ScheduleBroadcastDialogProps = {
  schedule: Schedule;
  groupId: string;
  canBroadcast?: boolean;
};

const TARGET_TYPE_LABELS: Record<BroadcastTargetType, string> = {
  no_response: "미응답자",
  not_going: "불참자",
  maybe: "미정자",
  all: "전체 (참석 제외)",
};

const TARGET_TYPE_DESCRIPTIONS: Record<BroadcastTargetType, string> = {
  no_response: "아직 RSVP를 하지 않은 멤버",
  not_going: "불참으로 응답한 멤버",
  maybe: "미정으로 응답한 멤버",
  all: "참석 외 모든 멤버 (미응답 + 불참 + 미정)",
};

function formatSentAt(isoString: string): string {
  return formatKo(new Date(isoString), "M월 d일 HH:mm");
}

function getDaysLeft(startsAt: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduleDate = new Date(startsAt);
  scheduleDate.setHours(0, 0, 0, 0);
  return differenceInDays(scheduleDate, today);
}

export function ScheduleBroadcastDialog({
  schedule,
  groupId,
  canBroadcast = false,
}: ScheduleBroadcastDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] =
    useState<BroadcastTargetType>("no_response");

  const { stats, getTargetMembers, getHistory, broadcastReminder, loading, sending } =
    useScheduleBroadcast(schedule.id, groupId);

  if (!canBroadcast) return null;

  const daysLeft = getDaysLeft(schedule.starts_at);
  const targetMembers = getTargetMembers(targetType);
  const history = getHistory();
  const lastHistory = history[0] ?? null;

  const previewMessage =
    daysLeft >= 0
      ? `${schedule.title} 일정이 ${daysLeft === 0 ? "오늘" : `${daysLeft}일 후`}입니다. RSVP를 확인해주세요.`
      : `${schedule.title} 일정이 지났습니다. RSVP를 확인해주세요.`;

  const targetCounts: Record<BroadcastTargetType, number> = {
    no_response: stats.noResponse,
    not_going: stats.notGoing,
    maybe: stats.maybe,
    all: stats.noResponse + stats.notGoing + stats.maybe,
  };

  async function handleSend() {
    if (targetMembers.length === 0) {
      toast.error("발송 대상 멤버가 없습니다");
      return;
    }

    const result = await broadcastReminder(
      targetType,
      schedule.title,
      Math.max(daysLeft, 0)
    );

    if (result.success) {
      toast.success(`${result.count}명에게 알림을 발송했습니다`);
      setOpen(false);
    } else {
      toast.error("알림 발송에 실패했습니다");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-3 w-3" />
        알림 발송
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              결석 사전 알림 발송
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 일정 정보 */}
            <div className="rounded-md border px-3 py-2 space-y-0.5">
              <p className="text-xs font-medium">{schedule.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatKo(new Date(schedule.starts_at), "yyyy년 M월 d일 (EEE) HH:mm")}
                {daysLeft >= 0 && (
                  <span className="ml-1.5 text-primary font-medium">
                    D-{daysLeft === 0 ? "day" : daysLeft}
                  </span>
                )}
              </p>
            </div>

            {/* RSVP 현황 요약 */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Users className="h-3 w-3" />
                RSVP 현황
              </p>
              {loading ? (
                <div className="h-6 bg-muted animate-pulse rounded" />
              ) : (
                <div className="flex flex-wrap gap-1">
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                    <Check className="h-2.5 w-2.5 mr-0.5" />
                    참석 {stats.going}명
                  </Badge>
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                    불참 {stats.notGoing}명
                  </Badge>
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                    미정 {stats.maybe}명
                  </Badge>
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
                    미응답 {stats.noResponse}명
                  </Badge>
                </div>
              )}
            </div>

            {/* 발송 대상 선택 */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-2">
                발송 대상 선택
              </p>
              <RadioGroup
                value={targetType}
                onValueChange={(v) => setTargetType(v as BroadcastTargetType)}
                className="space-y-1.5"
              >
                {(
                  [
                    "no_response",
                    "not_going",
                    "maybe",
                    "all",
                  ] as BroadcastTargetType[]
                ).map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={type}
                      id={`target-${type}`}
                      className="h-3.5 w-3.5"
                    />
                    <Label
                      htmlFor={`target-${type}`}
                      className="flex items-center justify-between flex-1 cursor-pointer"
                    >
                      <span className="text-xs">
                        {TARGET_TYPE_LABELS[type]}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 ml-1"
                      >
                        {targetCounts[type]}명
                      </Badge>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 메시지 미리보기 */}
            <div className="rounded-md bg-muted px-3 py-2 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                메시지 미리보기
              </p>
              <p className="text-xs">{previewMessage}</p>
            </div>

            {/* 발송 대상 없음 경고 */}
            {!loading && targetMembers.length === 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2.5 py-1.5">
                <AlertCircle className="h-3 w-3 shrink-0" />
                선택한 대상에 해당하는 멤버가 없습니다
              </div>
            )}

            {/* 마지막 발송 시간 */}
            {lastHistory && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Bell className="h-2.5 w-2.5" />
                마지막 발송:{" "}
                <span className="font-medium">
                  {formatSentAt(lastHistory.sentAt)}
                </span>
                &nbsp;·&nbsp;{TARGET_TYPE_LABELS[lastHistory.targetType]}{" "}
                {lastHistory.recipientCount}명
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={sending || loading || targetMembers.length === 0}
              onClick={handleSend}
            >
              <Send className="h-3 w-3" />
              {sending
                ? "발송 중..."
                : `${targetMembers.length}명에게 알림 발송`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
