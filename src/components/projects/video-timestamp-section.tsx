"use client";

import { useState } from "react";
import { Clock, Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useVideoTimestamps, parseTimestamp, formatTimestamp } from "@/hooks/use-video-timestamps";
import { useAuth } from "@/hooks/use-auth";

interface VideoTimestampSectionProps {
  videoId: string;
  videoUrl: string;
  groupId: string;
  canEdit?: boolean;
}

export function VideoTimestampSection({
  videoId,
  videoUrl,
  groupId,
  canEdit = false,
}: VideoTimestampSectionProps) {
  const { user, profile } = useAuth();
  const { timestamps, loading, addTimestamp, deleteTimestamp } =
    useVideoTimestamps(groupId, videoId);

  const [timeInput, setTimeInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 타임스탬프 클릭 시 해당 시간부터 영상 새 탭 열기
  function handleTimestampClick(seconds: number) {
    try {
      const url = new URL(videoUrl);
      // YouTube 처리: youtu.be, youtube.com 모두 지원
      const isYoutube =
        url.hostname.includes("youtube.com") ||
        url.hostname.includes("youtu.be");
      if (isYoutube) {
        url.searchParams.set("t", String(seconds));
      } else {
        url.searchParams.set("t", String(seconds));
      }
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      // URL 파싱 실패 시 그냥 새 탭 열기
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleAdd() {
    if (!timeInput.trim() || !commentInput.trim()) return;
    if (!user || !profile) {
      toast.error("로그인이 필요합니다");
      return;
    }

    const seconds = parseTimestamp(timeInput.trim());
    if (seconds <= 0 && timeInput.trim() !== "0:00") {
      toast.error("올바른 시간 형식을 입력해주세요 (예: 0:32, 1:05)");
      return;
    }

    setSubmitting(true);
    addTimestamp({
      videoId,
      seconds,
      comment: commentInput.trim(),
      authorName: profile.name,
      authorId: user.id,
    });
    setTimeInput("");
    setCommentInput("");
    setSubmitting(false);
    toast.success("타임스탬프가 추가되었습니다");
  }

  function handleDelete(timestampId: string) {
    deleteTimestamp(timestampId);
    toast.success("타임스탬프가 삭제되었습니다");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  if (loading) {
    return (
      <div className="h-6 w-24 rounded bg-muted animate-pulse" />
    );
  }

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        <span>타임스탬프 메모</span>
        {timestamps.length > 0 && (
          <span className="font-medium text-foreground">{timestamps.length}</span>
        )}
      </div>

      {/* 타임스탬프 목록 */}
      {timestamps.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          아직 타임스탬프 메모가 없습니다
        </p>
      ) : (
        <ul className="space-y-1">
          {timestamps.map((ts) => (
            <li
              key={ts.id}
              className="flex items-start gap-1.5 group/ts"
            >
              {/* 시간 버튼 */}
              <button
                type="button"
                onClick={() => handleTimestampClick(ts.seconds)}
                className="shrink-0 font-mono text-[10px] text-primary hover:underline cursor-pointer mt-0.5 leading-tight"
                title={`${formatTimestamp(ts.seconds)}으로 이동`}
              >
                [{formatTimestamp(ts.seconds)}]
              </button>

              {/* 코멘트 */}
              <span className="text-[10px] flex-1 leading-tight break-all">
                {ts.comment}
              </span>

              {/* 작성자 */}
              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                {ts.authorName}
              </span>

              {/* 삭제 버튼 (canEdit이거나 본인 작성) */}
              {(canEdit || (user && ts.authorId === user.id)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-0 group-hover/ts:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(ts.id)}
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 추가 인라인 폼 */}
      {user && (
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          <Input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0:32"
            className="h-6 text-[10px] w-16 font-mono px-1.5"
          />
          <Input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="코멘트 입력"
            className="h-6 text-[10px] flex-1 px-1.5"
          />
          <Button
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={handleAdd}
            disabled={
              submitting || !timeInput.trim() || !commentInput.trim()
            }
            title="타임스탬프 추가"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
