"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";

// ============================================================
// 세션 생성 다이얼로그
// ============================================================

export function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (showName: string, showDate: string) => void;
}) {
  const [showName, setShowName] = useState("");
  const [showDate, setShowDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { pending: submitting, execute } = useAsyncAction();

  const handleSubmit = async () => {
    if (!showName.trim()) {
      toast.error(TOAST.BACKSTAGE_LOG.SHOW_NAME_REQUIRED);
      return;
    }
    if (!showDate) {
      toast.error(TOAST.BACKSTAGE_LOG.DATE_REQUIRED);
      return;
    }
    await execute(async () => {
      onCreate(showName.trim(), showDate);
      setShowName("");
      setShowDate(new Date().toISOString().split("T")[0]);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby="create-session-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">새 공연 세션 시작</DialogTitle>
          <DialogDescription id="create-session-desc" className="text-xs">
            백스테이지 로그를 기록할 새 세션을 생성합니다.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-3 border-0 p-0 m-0">
          <legend className="sr-only">새 공연 세션 정보</legend>
          <div className="space-y-1">
            <Label htmlFor="session-show-name" className="text-xs">
              공연명
            </Label>
            <Input
              id="session-show-name"
              placeholder="예) 봄 정기공연 2회차"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="session-show-date" className="text-xs">
              공연 날짜
            </Label>
            <Input
              id="session-show-date"
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>
        </fieldset>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
            aria-busy={submitting}
          >
            <Play className="h-3 w-3 mr-1" aria-hidden="true" />
            세션 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
