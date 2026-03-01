"use client";

import { useState, useEffect, startTransition } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useEntitySettings } from "@/hooks/use-entity-settings";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import {
  FINANCE_AUTO_REMINDER_SETTING_KEY,
  DEFAULT_FINANCE_AUTO_REMINDER_SETTING,
  FINANCE_AUTO_REMINDER_LAST_SENT_KEY,
  type FinanceAutoReminderSettingValue,
  type FinanceAutoReminderLastSentValue,
} from "@/types";

type Props = {
  entityType: "group" | "project";
  entityId: string;
  groupId: string;
  groupName: string;
  projectId?: string | null;
};

// 마지막 알림 발송 시간을 "N일 전" 형식으로 변환
function formatLastSent(sentAt: string | null): string {
  if (!sentAt) return "없음";

  const now = new Date();
  const sent = new Date(sentAt);
  const diffMs = now.getTime() - sent.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return "1일 전";
  return `${diffDays}일 전`;
}

const INTERVAL_LABELS: Record<FinanceAutoReminderSettingValue["interval"], string> = {
  weekly: "매주",
  biweekly: "격주",
  monthly: "매월",
};

export function FinanceReminderSettings({
  entityType,
  entityId,
  groupId,
  groupName,
  projectId,
}: Props) {
  // 자동 알림 설정
  const {
    value: reminderSetting,
    loading: reminderLoading,
    save: saveReminder,
  } = useEntitySettings<FinanceAutoReminderSettingValue>(
    { entityType, entityId, key: FINANCE_AUTO_REMINDER_SETTING_KEY },
    DEFAULT_FINANCE_AUTO_REMINDER_SETTING
  );

  // 마지막 발송 시간 설정
  const {
    value: lastSentSetting,
    save: saveLastSent,
  } = useEntitySettings<FinanceAutoReminderLastSentValue>(
    {
      entityType,
      entityId,
      key: FINANCE_AUTO_REMINDER_LAST_SENT_KEY,
    },
    { sentAt: "", sentCount: 0 }
  );

  // 로컬 편집 상태
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval] = useState<FinanceAutoReminderSettingValue["interval"]>("monthly");
  const [message, setMessage] = useState(DEFAULT_FINANCE_AUTO_REMINDER_SETTING.message);
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const { pending: sendingNow, execute: executeSend } = useAsyncAction();

  // 설정 로드 후 로컬 상태 동기화
  useEffect(() => {
    if (!reminderLoading) {
      startTransition(() => {
        setEnabled(reminderSetting.enabled);
        setInterval(reminderSetting.interval);
        setMessage(reminderSetting.message);
      });
    }
  }, [reminderLoading, reminderSetting]);

  // 설정 저장
  const handleSave = async () => {
    await executeSave(async () => {
      const { error } = await saveReminder({ enabled, interval, message });
      if (error) {
        toast.error(TOAST.FINANCE.REMINDER_SAVE_ERROR);
      } else {
        toast.success(TOAST.FINANCE.REMINDER_SAVED);
      }
    });
  };

  // 지금 알림 보내기 (미납 멤버 조회 후 발송)
  const handleSendNow = async () => {
    await executeSend(async () => {
      const supabase = createClient();

      // 미납 멤버 조회 (paid_by가 있는 수입 거래 기준)
      const { data: transactions, error: txnError } = await supabase
        .from("finance_transactions")
        .select("paid_by, amount")
        .eq("group_id", groupId)
        .eq("type", "income")
        .not("paid_by", "is", null);

      if (txnError) {
        toast.error(TOAST.FINANCE.REMINDER_UNPAID_ERROR);
        return;
      }

      // 납부자별 총 납부 금액 집계
      const paidMap = new Map<string, number>();
      (transactions ?? []).forEach((txn: { paid_by: string | null; amount: number }) => {
        if (txn.paid_by) {
          paidMap.set(txn.paid_by, (paidMap.get(txn.paid_by) ?? 0) + txn.amount);
        }
      });

      if (paidMap.size === 0) {
        toast.error(TOAST.FINANCE.REMINDER_NO_DATA);
        return;
      }

      // 그룹 멤버 목록 조회
      const { data: members, error: memberError } = await supabase
        .from("group_members")
        .select("user_id, profiles(name)")
        .eq("group_id", groupId);

      if (memberError) {
        toast.error(TOAST.FINANCE.REMINDER_MEMBER_ERROR);
        return;
      }

      // 납부하지 않은 멤버 필터링 (간단한 기준: paid_by 기록이 없는 멤버)
      const paidUserIds = new Set(paidMap.keys());
      const unpaidMembers = (members ?? []).filter(
        (m: { user_id: string; profiles: unknown }) => !paidUserIds.has(m.user_id)
      );

      if (unpaidMembers.length === 0) {
        toast.success(TOAST.FINANCE.REMINDER_NO_UNPAID);
        return;
      }

      // 알림 발송
      let successCount = 0;
      let failCount = 0;

      for (const member of unpaidMembers) {
        try {
          const name =
            (member.profiles as { name?: string } | null)?.name ?? "회원";
          const customMessage = message
            .replace("{name}", name)
            .replace("{amount}", "미납");

          await createNotification({
            userId: member.user_id,
            type: "finance_unpaid",
            title: "회비 납부 상기 알림",
            message: `[${groupName}] ${customMessage}`,
            link: projectId
              ? `/groups/${groupId}/projects/${projectId}/finance`
              : `/groups/${groupId}/finance`,
          });

          successCount++;
        } catch {
          failCount++;
        }
      }

      // 마지막 발송 시간 저장
      await saveLastSent({
        sentAt: new Date().toISOString(),
        sentCount: (lastSentSetting.sentCount ?? 0) + successCount,
      });

      if (failCount === 0) {
        toast.success(`${successCount}명에게 상기 알림을 발송했습니다`);
      } else if (successCount > 0) {
        toast.success(`${successCount}명 발송 완료 (${failCount}명 실패)`);
      } else {
        toast.error(TOAST.FINANCE.REMINDER_SEND_ERROR);
      }
    });
  };

  if (reminderLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-xs text-muted-foreground">설정 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  const lastSentAt = lastSentSetting.sentAt || null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">자동 상기 알림 설정</CardTitle>
          </div>
          {enabled && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
            >
              {INTERVAL_LABELS[interval]} 활성
            </Badge>
          )}
        </div>
        <CardDescription className="text-[11px]">
          회비 미납 멤버에게 자동으로 납부 상기 알림을 발송합니다.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 활성화 토글 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium">자동 알림 활성화</Label>
            <p className="text-[11px] text-muted-foreground">
              설정한 주기마다 미납 멤버에게 자동으로 알림을 발송합니다
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* 알림 주기 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">알림 주기</Label>
          <Select
            value={interval}
            onValueChange={(v) =>
              setInterval(v as FinanceAutoReminderSettingValue["interval"])
            }
            disabled={!enabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">매주</SelectItem>
              <SelectItem value="biweekly">격주</SelectItem>
              <SelectItem value="monthly">매월</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 커스텀 알림 메시지 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">알림 메시지</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="알림 메시지를 입력하세요"
            className="text-xs min-h-[72px] resize-none"
            disabled={!enabled}
          />
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-blue-600">{"{name}"}</span> = 멤버 이름,{" "}
            <span className="font-medium text-blue-600">{"{amount}"}</span> = 미납 금액
          </p>
        </div>

        {/* 마지막 발송 정보 */}
        <div className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-muted/50">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">마지막 알림:</span>
          <span className="text-[11px] font-medium">
            {formatLastSent(lastSentAt)}
          </span>
          {lastSentSetting.sentCount > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground/60 mx-0.5">·</span>
              <span className="text-[10px] text-muted-foreground">
                누적 {lastSentSetting.sentCount}명 발송
              </span>
            </>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 flex-1"
            onClick={handleSendNow}
            disabled={sendingNow || saving}
          >
            {sendingNow ? (
              <>
                <BellRing className="h-3 w-3 animate-pulse" />
                발송 중...
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                지금 알림 보내기
              </>
            )}
          </Button>

          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 flex-1"
            onClick={handleSave}
            disabled={saving || sendingNow}
          >
            {saving ? "저장 중..." : "설정 저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
