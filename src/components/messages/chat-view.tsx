"use client";

import { useRef, useEffect, useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { formatYearMonthDay } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/client";
import { useConversation } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Send, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@/types";

function formatDateSeparator(date: Date): string {
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  return formatYearMonthDay(date);
}

const DateSeparator = memo(function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
});

type MessageBubbleProps = {
  msg: Message;
  isMine: boolean;
  isFirstInGroup: boolean;
  partnerName: string | null;
  partnerAvatarUrl: string | null;
};

const MessageBubble = memo(function MessageBubble({
  msg,
  isMine,
  isFirstInGroup,
  partnerName,
  partnerAvatarUrl,
}: MessageBubbleProps) {
  const msgDate = new Date(msg.created_at);
  const isOptimistic = msg.id.startsWith("optimistic-");

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} ${
        isFirstInGroup ? "mt-3" : "mt-0.5"
      }`}
    >
      {/* 상대방 아바타 */}
      {!isMine && (
        <div className="w-8 shrink-0 mr-2">
          {isFirstInGroup && (
            <UserAvatar
              name={partnerName || "U"}
              avatarUrl={partnerAvatarUrl}
              size="md"
              className="h-8 w-8"
            />
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
        {/* 상대 이름 (첫 메시지만) */}
        {!isMine && isFirstInGroup && (
          <p className="text-xs font-medium text-muted-foreground mb-1 ml-1">
            {partnerName}
          </p>
        )}

        {/* 메시지 버블 */}
        <div
          className={`px-3 py-2 ${
            isMine
              ? "bg-blue-500 text-white rounded-2xl rounded-br-md"
              : "bg-muted rounded-2xl rounded-bl-md"
          } ${isOptimistic ? "opacity-70" : ""}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        </div>

        {/* 시간 + 읽음 표시 */}
        <div
          className={`flex items-center gap-1 mt-0.5 ${
            isMine ? "justify-end mr-1" : "ml-1"
          }`}
        >
          <span className="text-[10px] text-muted-foreground">
            {format(msgDate, "HH:mm")}
          </span>
          {isMine && msg.read_at && (
            <CheckCheck className="h-3 w-3 text-blue-500" />
          )}
        </div>
      </div>
    </div>
  );
});

interface ChatViewProps {
  partnerId: string;
}

export function ChatView({ partnerId }: ChatViewProps) {
  const { user } = useAuth();
  const {
    messages,
    partnerName,
    partnerAvatarUrl,
    loading,
    hasMore,
    loadingMore,
    loadMore,
    refetch,
    addOptimisticMessage,
    replaceOptimistic,
  } = useConversation(partnerId);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabaseRef = useRef(createClient());
  // 이전 메시지 수를 추적해 loadMore 후 스크롤 점프 방지
  const prevMessageCountRef = useRef(messages.length);
  const isLoadingMoreRef = useRef(false);

  // 새 메시지(실시간/전송) 시에만 하단 스크롤
  useEffect(() => {
    if (isLoadingMoreRef.current) {
      // loadMore 직후에는 스크롤 위치를 유지
      isLoadingMoreRef.current = false;
      prevMessageCountRef.current = messages.length;
      return;
    }
    const addedCount = messages.length - prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (addedCount > 0 && addedCount <= 3) {
      // 적은 수의 메시지 추가 = 실시간/전송 → 하단 스크롤
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (prevMessageCountRef.current === messages.length) {
      // 초기 로딩 완료 시 하단으로
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  // 초기 로딩 완료 후 하단으로 스크롤
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!loading && !initialScrollDone.current && messages.length > 0) {
      initialScrollDone.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [loading, messages.length]);

  // loadMore 호출 시 스크롤 위치 보존
  const handleLoadMore = useCallback(async () => {
    const container = scrollContainerRef.current;
    if (!container) {
      loadMore();
      return;
    }
    // 현재 스크롤 높이 저장
    const prevScrollHeight = container.scrollHeight;
    isLoadingMoreRef.current = true;
    await loadMore();
    // 다음 렌더 후 스크롤 위치 복원
    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeight;
    });
  }, [loadMore]);

  // Realtime 구독: 새 메시지 수신 + 읽음 상태 업데이트
  useEffect(() => {
    if (!user) return;
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`chat:${partnerId}:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          if (payload.new && payload.new.sender_id === partnerId) {
            refetch();
            setLiveAnnouncement(`${partnerName ?? "상대방"}님의 새 메시지가 도착했습니다`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          // 상대방이 내 메시지를 읽었을 때 read_at 업데이트 반영
          if (payload.new && payload.new.receiver_id === partnerId && payload.new.read_at) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, refetch]);

  const handleSend = useCallback(async () => {
    if (!content.trim() || sending || !user) return;

    const trimmed = content.trim();
    setContent("");
    setSending(true);

    // 낙관적 UI 업데이트: 즉시 화면에 표시
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: user.id,
      receiver_id: partnerId,
      content: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    addOptimisticMessage(optimisticMsg);

    const { error } = await supabaseRef.current.from("messages").insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: trimmed,
    });

    setSending(false);

    if (error) {
      toast.error("메시지 전송에 실패했습니다");
      setContent(trimmed); // 실패 시 입력 내용 복원
      replaceOptimistic(); // 낙관적 메시지 제거
    } else {
      replaceOptimistic(); // 서버 데이터로 교체
    }

    inputRef.current?.focus();
  }, [content, sending, user, partnerId, addOptimisticMessage, replaceOptimistic]);

  // 메시지 렌더링 메모이제이션
  const renderedMessages = useMemo(() => {
    const elements: React.ReactNode[] = [];

    messages.forEach((msg: Message, idx: number) => {
      const msgDate = new Date(msg.created_at);
      const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;

      // 날짜 구분선
      if (!prevDate || !isSameDay(msgDate, prevDate)) {
        elements.push(
          <DateSeparator
            key={`date-${msg.created_at}`}
            label={formatDateSeparator(msgDate)}
          />
        );
      }

      const isMine = msg.sender_id === user?.id;
      const isFirstInGroup =
        idx === 0 ||
        messages[idx - 1].sender_id !== msg.sender_id ||
        (prevDate && !isSameDay(msgDate, prevDate));

      elements.push(
        <MessageBubble
          key={msg.id}
          msg={msg}
          isMine={isMine}
          isFirstInGroup={!!isFirstInGroup}
          partnerName={partnerName ?? null}
          partnerAvatarUrl={partnerAvatarUrl ?? null}
        />
      );
    });

    return elements;
  }, [messages, user?.id, partnerName, partnerAvatarUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 스크린리더 전용 실시간 알림 영역 */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* 채팅 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          asChild
          aria-label="뒤로"
        >
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <UserAvatar
          name={partnerName || "U"}
          avatarUrl={partnerAvatarUrl}
          size="md"
          className="h-8 w-8"
        />
        <span className="text-sm font-semibold">{partnerName}</span>
      </div>

      {/* 메시지 목록 */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-label={`${partnerName ?? "상대방"}와의 대화 내용`}
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {/* 이전 메시지 불러오기 버튼 */}
        {hasMore && (
          <div className="flex justify-center py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs h-7"
            >
              {loadingMore && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              이전 메시지 불러오기
            </Button>
          </div>
        )}
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            메시지를 보내 대화를 시작하세요
          </p>
        ) : (
          renderedMessages
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            placeholder="메시지 입력..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            maxLength={5000}
            aria-label="메시지 입력"
            className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-full border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={1}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={handleSend}
            disabled={!content.trim() || sending}
            aria-disabled={!content.trim() || sending}
            aria-label="전송"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
