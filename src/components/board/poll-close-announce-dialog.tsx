"use client";

import { useState } from "react";
import { Trophy, Megaphone, Copy, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BoardPoll, BoardPollOptionWithVotes } from "@/types";
import {
  generateResultText,
  isAnnounced,
  announceResult,
} from "@/hooks/use-poll-auto-announce";

// ============================================================
// Props
// ============================================================

interface PollCloseAnnounceDialogProps {
  poll: BoardPoll;
  options: BoardPollOptionWithVotes[];
  postTitle: string;
  postId: string;
  groupId: string;
  canAnnounce: boolean;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function PollCloseAnnounceDialog({
  poll,
  options,
  postTitle,
  postId,
  groupId,
  canAnnounce,
}: PollCloseAnnounceDialogProps) {
  const [open, setOpen] = useState(false);
  const [announced, setAnnounced] = useState(() => isAnnounced(poll.id));
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);
  const sorted = [...options].sort((a, b) => b.vote_count - a.vote_count);

  // ---- 결과 텍스트 복사 ----
  const handleCopy = async () => {
    const text = generateResultText(options, postTitle);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("결과 텍스트가 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("클립보드 복사에 실패했습니다");
    }
  };

  // ---- 그룹 알림 발송 ----
  const handleAnnounce = async () => {
    setSending(true);
    const result = await announceResult(groupId, poll, options, postTitle, postId);
    setSending(false);
    if (result.success) {
      setAnnounced(true);
      toast.success("그룹 전체 멤버에게 투표 결과를 공지했습니다");
    } else {
      toast.error(result.error ?? "알림 발송에 실패했습니다");
    }
  };

  if (!canAnnounce) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px] gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          <Megaphone className="h-3 w-3" />
          결과 공지
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Megaphone className="h-4 w-4 text-amber-600" />
            투표 결과 공지
          </DialogTitle>
        </DialogHeader>

        {/* 투표 제목 */}
        <p className="text-xs font-medium leading-snug text-muted-foreground">
          {postTitle}
        </p>

        {/* 결과 요약 */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          {sorted.map((opt, idx) => {
            const pct =
              totalVotes > 0
                ? Math.round((opt.vote_count / totalVotes) * 100)
                : 0;
            const isFirst = idx === 0;
            return (
              <div
                key={opt.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  isFirst ? "bg-yellow-100" : ""
                }`}
              >
                {isFirst ? (
                  <Trophy className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                ) : (
                  <span className="text-[10px] text-muted-foreground w-3.5 text-center shrink-0">
                    {idx + 1}
                  </span>
                )}
                <span
                  className={`text-xs flex-1 min-w-0 truncate ${
                    isFirst ? "font-semibold text-yellow-800" : "text-foreground"
                  }`}
                >
                  {opt.text}
                </span>
                {isFirst ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 shrink-0">
                    {opt.vote_count}표 {pct}%
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {opt.vote_count}표 {pct}%
                  </span>
                )}
              </div>
            );
          })}

          <div className="border-t pt-2 text-[11px] text-muted-foreground text-right">
            총 {totalVotes}명 투표
          </div>
        </div>

        {/* 이미 공지한 경우 안내 */}
        {announced && (
          <div className="flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-3 py-2">
            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <p className="text-xs text-green-700">이미 결과를 공지했습니다</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 w-full"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "복사됨" : "결과 텍스트 복사"}
          </Button>

          {announced ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 w-full border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={handleAnnounce}
              disabled={sending}
            >
              <Bell className="h-3.5 w-3.5" />
              {sending ? "발송 중..." : "재발송"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleAnnounce}
              disabled={sending}
            >
              <Bell className="h-3.5 w-3.5" />
              {sending ? "발송 중..." : "그룹 알림 발송"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
