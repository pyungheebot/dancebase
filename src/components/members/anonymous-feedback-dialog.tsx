"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, Send, MessageCirclePlus } from "lucide-react";
import { toast } from "sonner";
import {
  useAnonymousFeedback,
  CATEGORY_LABELS,
} from "@/hooks/use-anonymous-feedback";
import type { FeedbackCategory } from "@/types";

// ============================================
// 카테고리 스타일 매핑
// ============================================

const CATEGORY_STYLES: Record<
  FeedbackCategory,
  { badge: string; radio: string }
> = {
  praise: {
    badge: "bg-green-100 text-green-700 hover:bg-green-100 border-0",
    radio: "text-green-600",
  },
  encouragement: {
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-0",
    radio: "text-blue-600",
  },
  improvement: {
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-0",
    radio: "text-orange-600",
  },
  other: {
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100 border-0",
    radio: "text-gray-500",
  },
};

const CATEGORIES: FeedbackCategory[] = [
  "praise",
  "encouragement",
  "improvement",
  "other",
];

// ============================================
// Props
// ============================================

type AnonymousFeedbackDialogProps = {
  groupId: string;
  currentUserId: string;
  targetUserId: string;
  targetName: string;
  trigger?: React.ReactNode;
};

// ============================================
// 컴포넌트
// ============================================

export function AnonymousFeedbackDialog({
  groupId,
  currentUserId,
  targetUserId,
  targetName,
  trigger,
}: AnonymousFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("praise");
  const [content, setContent] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const { sendFeedback, hasSentTo } = useAnonymousFeedback(groupId);

  const alreadySent = hasSentTo(currentUserId, targetUserId);
  const MAX_LENGTH = 300;

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }
    if (content.trim().length < 5) {
      toast.error("최소 5자 이상 작성해주세요");
      return;
    }

    await execute(async () => {
      sendFeedback(currentUserId, targetUserId, category, content);
      toast.success("피드백이 익명으로 전송되었습니다");
      setOpen(false);
      setContent("");
      setCategory("praise");
    });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setContent("");
      setCategory("praise");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            <MessageCirclePlus className="h-3 w-3 mr-1" />
            익명 피드백
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            <span className="font-semibold">{targetName}</span>에게 피드백 보내기
          </DialogTitle>
        </DialogHeader>

        {alreadySent ? (
          // 이미 보낸 경우
          <div className="py-8 text-center space-y-2">
            <MessageCirclePlus className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">
              이미 이 멤버에게 피드백을 보냈습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 카테고리 선택 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">카테고리</Label>
              <RadioGroup
                value={category}
                onValueChange={(val) => setCategory(val as FeedbackCategory)}
                className="grid grid-cols-2 gap-2"
              >
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setCategory(cat)}
                  >
                    <RadioGroupItem value={cat} id={`anon-fb-${cat}`} />
                    <Label
                      htmlFor={`anon-fb-${cat}`}
                      className="cursor-pointer"
                    >
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${CATEGORY_STYLES[cat].badge}`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 내용 입력 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">내용</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="구체적이고 건설적인 내용을 작성해 주세요"
                maxLength={MAX_LENGTH}
                className="min-h-[90px] text-xs resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {content.length}/{MAX_LENGTH}
              </p>
            </div>

            {/* 익명 안내 */}
            <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                익명으로 전송됩니다. 작성자 정보는 절대 공개되지 않습니다.
              </p>
            </div>

            {/* 전송 버튼 */}
            <Button
              className="w-full h-8 text-xs"
              onClick={handleSubmit}
              disabled={submitting || !content.trim() || content.trim().length < 5}
            >
              <Send className="h-3 w-3 mr-1.5" />
              익명으로 전송
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
