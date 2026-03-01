"use client";

import { useState } from "react";
import { Calendar, Copy, ExternalLink, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type ScheduleIcsSubscribeProps = {
  groupId: string;
};

export function ScheduleIcsSubscribe({ groupId }: ScheduleIcsSubscribeProps) {
  const [open, setOpen] = useState(false);
  const { copy } = useCopyToClipboard({
    successMessage: "구독 URL이 클립보드에 복사되었습니다.",
    errorMessage: "클립보드 복사에 실패했습니다.",
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const httpsUrl = `${origin}/api/groups/${groupId}/calendar.ics`;
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");

  const handleCopy = async () => {
    await copy(httpsUrl);
  };

  const handleGoogleCalendar = () => {
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  };

  const handleAppleCalendar = () => {
    window.location.href = webcalUrl;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Calendar className="h-3 w-3" />
          캘린더 구독
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            캘린더 구독
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 구독 URL */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              구독 URL
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={httpsUrl}
                className="text-xs h-8 font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 shrink-0 gap-1 text-xs"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
                복사
              </Button>
            </div>
          </div>

          {/* 캘린더 앱 추가 버튼 */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              캘린더 앱에 추가
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 justify-start"
                onClick={handleGoogleCalendar}
              >
                <ExternalLink className="h-3 w-3" />
                Google 캘린더에 추가
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 justify-start"
                onClick={handleAppleCalendar}
              >
                <Link className="h-3 w-3" />
                Apple 캘린더에 추가
              </Button>
            </div>
          </div>

          {/* 안내 텍스트 */}
          <p className="text-[11px] text-muted-foreground leading-relaxed border-t pt-3">
            위 URL을 캘린더 앱에 등록하면 일정이 자동으로 동기화됩니다.
            구독 후에는 새 일정이 추가되거나 변경될 때 캘린더에 자동으로
            반영됩니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
