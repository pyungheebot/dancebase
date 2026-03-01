"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Send, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendWinBackMessages, type WinBackRecipient } from "@/lib/win-back-message";

// ============================================
// 메시지 템플릿 정의
// ============================================

type TemplateKey = "activity_guide" | "upcoming_schedule" | "custom";

type MessageTemplate = {
  key: TemplateKey;
  label: string;
  content: string;
};

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "activity_guide",
    label: "활동 참여 안내",
    content:
      "안녕하세요 {name}님! 최근 그룹 활동에 참여하지 않으셔서 연락드립니다. 다가오는 일정에 함께해주세요!",
  },
  {
    key: "upcoming_schedule",
    label: "다가올 일정 알림",
    content:
      "안녕하세요 {name}님! 곧 있을 일정에 함께하시면 좋겠습니다. 많은 멤버들이 기다리고 있어요!",
  },
  {
    key: "custom",
    label: "자유 입력",
    content: "",
  },
];

// ============================================
// Props
// ============================================

type WinBackMessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: WinBackRecipient[];
};

// ============================================
// 컴포넌트
// ============================================

export function WinBackMessageDialog({
  open,
  onOpenChange,
  recipients,
}: WinBackMessageDialogProps) {
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<TemplateKey>("activity_guide");
  const [customContent, setCustomContent] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const selectedTemplate = MESSAGE_TEMPLATES.find(
    (t) => t.key === selectedTemplateKey
  )!;

  // 실제 발송에 사용할 메시지
  const activeContent =
    selectedTemplateKey === "custom"
      ? customContent
      : selectedTemplate.content;

  // 미리보기: 첫 번째 수신자 이름으로 치환
  const previewName = recipients[0]?.name ?? "멤버";
  const previewContent = activeContent.replace(/\{name\}/g, previewName);

  const handleSend = async () => {
    if (!activeContent.trim()) {
      toast.error(TOAST.MEMBERS.WINBACK_MESSAGE_REQUIRED);
      return;
    }
    if (recipients.length === 0) {
      toast.error(TOAST.MEMBERS.WINBACK_MESSAGE_RECEIVER_REQUIRED);
      return;
    }

    setSending(true);
    try {
      const supabase = createClient();
      if (!user) {
        toast.error(TOAST.MEMBERS.WINBACK_MESSAGE_LOGIN_REQUIRED);
        return;
      }

      const { successCount, failCount } = await sendWinBackMessages(
        supabase,
        user.id,
        recipients,
        activeContent
      );

      if (failCount === 0) {
        toast.success(`${successCount}명에게 복귀 메시지를 발송했습니다`);
      } else if (successCount > 0) {
        toast.success(
          `${successCount}명 발송 완료, ${failCount}명 발송 실패`
        );
      } else {
        toast.error(TOAST.MEMBERS.WINBACK_SEND_ERROR2);
      }

      onOpenChange(false);
    } catch {
      toast.error(TOAST.MEMBERS.WINBACK_SEND_ERROR);
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!sending) {
      onOpenChange(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Send className="h-4 w-4" />
            복귀 메시지 보내기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 수신자 목록 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              수신자
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200 ml-1">
                {recipients.length}명
              </Badge>
            </Label>
            <div className="flex flex-wrap gap-1 rounded-md border px-2.5 py-2 bg-muted/30 min-h-[36px]">
              {recipients.map((r) => (
                <Badge
                  key={r.userId}
                  variant="secondary"
                  className="text-[11px] px-1.5 py-0 h-5"
                >
                  {r.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* 템플릿 선택 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메시지 템플릿</Label>
            <Select
              value={selectedTemplateKey}
              onValueChange={(v) => setSelectedTemplateKey(v as TemplateKey)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map((t) => (
                  <SelectItem key={t.key} value={t.key} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 자유 입력 영역 */}
          {selectedTemplateKey === "custom" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">메시지 내용</Label>
              <Textarea
                placeholder="{name}을 입력하면 수신자 이름으로 자동 치환됩니다."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="text-xs min-h-[80px] resize-none"
              />
            </div>
          )}

          {/* 미리보기 */}
          {activeContent.trim() && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                미리보기 ({previewName}님 기준)
              </Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {previewContent}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
            disabled={sending}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSend}
            disabled={sending || !activeContent.trim()}
          >
            <Send className="h-3 w-3 mr-1" />
            {sending ? "발송 중..." : `${recipients.length}명에게 발송`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
