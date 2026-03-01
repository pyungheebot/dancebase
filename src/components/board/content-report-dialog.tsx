"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

const REASON_LABELS: Record<ReportReason, string> = {
  spam: "스팸",
  harassment: "괴롭힘",
  inappropriate: "부적절한 내용",
  other: "기타",
};

interface ContentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  targetType: "post" | "comment";
  targetId: string;
}

export function ContentReportDialog({
  open,
  onOpenChange,
  groupId,
  targetType,
  targetId,
}: ContentReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const handleSubmit = async () => {
    await execute(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const { error } = await supabase.from("content_reports").insert({
        group_id: groupId,
        target_type: targetType,
        target_id: targetId,
        reporter_id: user.id,
        reason,
        description: description.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("이미 신고한 콘텐츠입니다");
        } else {
          toast.error("신고 제출에 실패했습니다");
        }
        return;
      }

      toast.success("신고가 접수되었습니다");
      setReason("spam");
      setDescription("");
      onOpenChange(false);
    });
  };

  const handleClose = () => {
    if (submitting) return;
    setReason("spam");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {targetType === "post" ? "게시글" : "댓글"} 신고
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">신고 사유</Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as ReportReason)}
              className="space-y-1.5"
            >
              {(Object.keys(REASON_LABELS) as ReportReason[]).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <RadioGroupItem value={key} id={`reason-${key}`} />
                  <Label
                    htmlFor={`reason-${key}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {REASON_LABELS[key]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              추가 설명{" "}
              <span className="text-muted-foreground font-normal">(선택사항)</span>
            </Label>
            <Textarea
              placeholder="신고 내용을 자세히 입력해 주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[72px] resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "제출 중..." : "신고하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
