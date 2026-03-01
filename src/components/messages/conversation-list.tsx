"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatRelative } from "@/lib/date-utils";
import { useConversations } from "@/hooks/use-messages";
import { useScrollRestoreRef } from "@/hooks/use-scroll-restore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, SquarePen } from "lucide-react";
import { NewConversationDialog } from "./new-conversation-dialog";
import { EmptyState } from "@/components/shared/empty-state";

export function ConversationList() {
  const pathname = usePathname();
  const { conversations, loading } = useConversations();
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  // 대화 목록 스크롤 위치 복원 (커스텀 스크롤 컨테이너 ref 방식)
  const scrollRef = useScrollRestoreRef("scroll-messages-conversations");

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h1 className="text-lg font-bold">메시지</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setNewDialogOpen(true)}
          aria-label="새 대화"
        >
          <SquarePen className="h-5 w-5" />
        </Button>
      </div>

      {/* 대화 목록 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="메시지가 없습니다"
            description="새 대화를 시작해보세요"
            action={{ label: "새 대화", onClick: () => setNewDialogOpen(true) }}
            className="border-0 bg-transparent"
          />
        ) : (
          <div className="py-1">
            {conversations.map((conv) => {
              const isActive = pathname === `/messages/${conv.partner_id}`;
              const hasUnread = conv.unread_count > 0;

              return (
                <Link
                  key={conv.partner_id}
                  href={`/messages/${conv.partner_id}`}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    isActive ? "bg-muted" : ""
                  }`}
                >
                  {/* 아바타 + 읽지 않음 표시 */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      {conv.partner_avatar_url && (
                        <AvatarImage src={conv.partner_avatar_url} />
                      )}
                      <AvatarFallback className="text-base">
                        {conv.partner_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                    )}
                  </div>

                  {/* 이름 + 마지막 메시지 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm truncate ${
                          hasUnread ? "font-bold" : "font-medium"
                        }`}
                      >
                        {conv.partner_name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatRelative(new Date(conv.last_message_at))}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate mt-0.5 ${
                        hasUnread
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conv.last_message}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <NewConversationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
      />
    </div>
  );
}
