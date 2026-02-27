"use client";

import { useState } from "react";
import {
  Bell,
  Clock,
  MessageSquare,
  Megaphone,
  Smartphone,
  Moon,
  Sun,
  Sunset,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCommunicationPreferences } from "@/hooks/use-communication-preferences";
import type { CommPreferredTime, CommChannel } from "@/types";

// ============================================
// 시간대 메타
// ============================================

const PREFERRED_TIME_OPTIONS: {
  value: CommPreferredTime;
  label: string;
  desc: string;
  Icon: React.ElementType;
  colorClass: string;
}[] = [
  {
    value: "morning",
    label: "아침",
    desc: "06:00 ~ 12:00",
    Icon: Coffee,
    colorClass: "text-amber-500",
  },
  {
    value: "afternoon",
    label: "점심",
    desc: "12:00 ~ 18:00",
    Icon: Sun,
    colorClass: "text-yellow-500",
  },
  {
    value: "evening",
    label: "저녁",
    desc: "18:00 ~ 22:00",
    Icon: Sunset,
    colorClass: "text-orange-500",
  },
  {
    value: "night",
    label: "밤",
    desc: "22:00 ~ 06:00",
    Icon: Moon,
    colorClass: "text-indigo-500",
  },
];

// ============================================
// 채널 메타
// ============================================

const CHANNEL_OPTIONS: {
  value: CommChannel;
  label: string;
  desc: string;
  Icon: React.ElementType;
}[] = [
  {
    value: "push",
    label: "푸시 알림",
    desc: "앱 푸시 알림으로 수신",
    Icon: Smartphone,
  },
  {
    value: "message",
    label: "메시지",
    desc: "1:1 메시지로 수신",
    Icon: MessageSquare,
  },
  {
    value: "board",
    label: "게시판",
    desc: "게시판 공지로 수신",
    Icon: Megaphone,
  },
];

// ============================================
// Props
// ============================================

type Props = {
  groupId: string;
  userId: string;
  /** 트리거 버튼을 커스텀하려면 이 prop에 ReactNode 전달 */
  trigger?: React.ReactNode;
};

// ============================================
// 메인 컴포넌트
// ============================================

export function CommunicationPreferencesDialog({
  groupId,
  userId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const {
    preference,
    loading,
    updatePreferences,
    togglePreferredTime,
    toggleChannel,
  } = useCommunicationPreferences(groupId, userId);

  // 조용한 시간대 로컬 상태 (Input 제어용)
  const [quietStart, setQuietStart] = useState(preference.quietHoursStart);
  const [quietEnd, setQuietEnd] = useState(preference.quietHoursEnd);

  // 다이얼로그 열릴 때 최신 값으로 동기화
  function handleOpenChange(next: boolean) {
    if (next) {
      setQuietStart(preference.quietHoursStart);
      setQuietEnd(preference.quietHoursEnd);
    }
    setOpen(next);
  }

  function handleSaveQuietHours() {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(quietStart)) {
      toast.error("조용한 시간 시작을 HH:MM 형식으로 입력해 주세요.");
      return;
    }
    if (!timeRegex.test(quietEnd)) {
      toast.error("조용한 시간 종료를 HH:MM 형식으로 입력해 주세요.");
      return;
    }
    const ok = updatePreferences({
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
    });
    if (ok) {
      toast.success("조용한 시간대가 저장되었습니다.");
    }
  }

  function handleToggleTime(time: CommPreferredTime) {
    togglePreferredTime(time);
  }

  function handleToggleChannel(channel: CommChannel) {
    toggleChannel(channel);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Bell className="h-3 w-3 mr-1" />
            연락 선호도
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-muted-foreground" />
            연락 선호도 설정
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            불러오는 중...
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* 선호 연락 시간대 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold">선호 연락 시간대</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PREFERRED_TIME_OPTIONS.map(({ value, label, desc, Icon, colorClass }) => {
                  const checked = preference.preferredTimes.includes(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors",
                        checked
                          ? "border-primary/50 bg-primary/5"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => handleToggleTime(value)}
                        className="h-3.5 w-3.5 mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <Icon className={cn("h-3 w-3 shrink-0", colorClass)} />
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* 선호 알림 채널 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold">선호 알림 채널</Label>
              </div>
              <div className="space-y-1.5">
                {CHANNEL_OPTIONS.map(({ value, label, desc, Icon }) => {
                  const checked = preference.preferredChannels.includes(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors",
                        checked
                          ? "border-primary/50 bg-primary/5"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => handleToggleChannel(value)}
                        className="h-3.5 w-3.5"
                      />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-medium">{label}</span>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* 조용한 시간대 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-semibold">조용한 시간대</Label>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1">
                해당 시간대에는 알림을 보내지 않습니다.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">시작</Label>
                  <Input
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    placeholder="22:00"
                    className="h-8 text-xs"
                    maxLength={5}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-5">~</span>
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">종료</Label>
                  <Input
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    placeholder="08:00"
                    className="h-8 text-xs"
                    maxLength={5}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs mt-5 shrink-0"
                  onClick={handleSaveQuietHours}
                >
                  저장
                </Button>
              </div>
            </div>

            {/* 마지막 수정 일시 */}
            {preference.updatedAt && (
              <p className="text-[10px] text-muted-foreground text-right">
                마지막 수정: {new Date(preference.updatedAt).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => setOpen(false)}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
