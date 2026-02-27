"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AppLayout } from "@/components/layout/app-layout";
import { useConversations } from "@/hooks/use-messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/shared/page-skeleton";
import { Mail } from "lucide-react";

export default function MessagesPage() {
  const { conversations, loading } = useConversations();

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-6 py-6">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            쪽지함
          </h1>
          <ListSkeleton rows={5} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          쪽지함
        </h1>

        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">쪽지가 없습니다</p>
          </div>
        ) : (
          <div className="rounded border divide-y">
            {conversations.map((conv) => (
              <Link
                key={conv.partner_id}
                href={`/messages/${conv.partner_id}`}
                className="flex items-center gap-2 px-2.5 py-2 hover:bg-muted transition-colors"
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {conv.partner_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{conv.partner_name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1.5">
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-[11px] text-muted-foreground truncate">
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <Badge className="h-4 min-w-[16px] px-1 text-[9px] shrink-0">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
