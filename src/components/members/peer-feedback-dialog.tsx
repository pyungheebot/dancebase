"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageCircle, ThumbsUp, TrendingUp, Send } from "lucide-react";
import { toast } from "sonner";
import { usePeerFeedback, TYPE_LABELS } from "@/hooks/use-peer-feedback";
import type { PeerFeedbackType } from "@/types";

// ============================================
// 피드백 보내기 Dialog
// ============================================

type PeerFeedbackSendDialogProps = {
  groupId: string;
  currentUserId: string;
  receiverId: string;
  receiverName: string;
};

export function PeerFeedbackSendDialog({
  groupId,
  currentUserId,
  receiverId,
  receiverName,
}: PeerFeedbackSendDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PeerFeedbackType>("strength");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { sendFeedback, hasSentTo } = usePeerFeedback(groupId);

  const alreadySent = hasSentTo(currentUserId, receiverId);

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      sendFeedback(currentUserId, receiverId, receiverName, type, content.trim());
      toast.success("피드백이 익명으로 전송되었습니다");
      setOpen(false);
      setContent("");
      setType("strength");
    } catch {
      toast.error("피드백 전송에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="text-muted-foreground hover:text-foreground"
          title={`${receiverName}에게 피드백 보내기`}
        >
          <MessageCircle className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            <span className="font-semibold">{receiverName}</span>에게 익명 피드백
          </DialogTitle>
        </DialogHeader>

        {alreadySent ? (
          <div className="py-6 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              이미 피드백을 보냈습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 피드백 타입 선택 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">피드백 유형</Label>
              <RadioGroup
                value={type}
                onValueChange={(val) => setType(val as PeerFeedbackType)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="strength" id="fb-strength" />
                  <Label
                    htmlFor="fb-strength"
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <ThumbsUp className="h-3 w-3 text-green-600" />
                    <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 border-0 hover:bg-green-100">
                      {TYPE_LABELS.strength}
                    </Badge>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="improvement" id="fb-improvement" />
                  <Label
                    htmlFor="fb-improvement"
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 border-0 hover:bg-blue-100">
                      {TYPE_LABELS.improvement}
                    </Badge>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 내용 입력 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">내용</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="구체적으로 작성할수록 도움이 됩니다"
                maxLength={300}
                className="min-h-[80px] text-xs resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {content.length}/300
              </p>
            </div>

            <Button
              className="w-full h-8 text-xs"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              <Send className="h-3 w-3 mr-1.5" />
              익명으로 보내기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 내가 받은 피드백 Sheet
// ============================================

type MyFeedbackSheetProps = {
  groupId: string;
  currentUserId: string;
};

export function MyFeedbackSheet({ groupId, currentUserId }: MyFeedbackSheetProps) {
  const { getMyFeedback, getStrengthCount, getImprovementCount } =
    usePeerFeedback(groupId);

  const myFeedbacks = getMyFeedback(currentUserId);
  const strengthCount = getStrengthCount(currentUserId);
  const improvementCount = getImprovementCount(currentUserId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
          <MessageCircle className="h-3 w-3 mr-0.5" />
          내 피드백
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-sm">내가 받은 피드백</SheetTitle>
        </SheetHeader>

        {/* 요약 배지 */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 border-0 hover:bg-green-100">
            <ThumbsUp className="h-2.5 w-2.5 mr-1" />
            잘하는 점 {strengthCount}개
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 border-0 hover:bg-blue-100">
            <TrendingUp className="h-2.5 w-2.5 mr-1" />
            개선점 {improvementCount}개
          </Badge>
        </div>

        {/* 피드백 목록 */}
        {myFeedbacks.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              아직 받은 피드백이 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
            {myFeedbacks
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-lg border px-3 py-2 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    {fb.type === "strength" ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 border-0 hover:bg-green-100">
                        <ThumbsUp className="h-2.5 w-2.5 mr-1" />
                        {TYPE_LABELS.strength}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 border-0 hover:bg-blue-100">
                        <TrendingUp className="h-2.5 w-2.5 mr-1" />
                        {TYPE_LABELS.improvement}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(fb.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{fb.content}</p>
                </div>
              ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
