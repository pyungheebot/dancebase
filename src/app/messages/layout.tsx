"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { ConversationList } from "@/components/messages/conversation-list";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isConversationOpen = pathname !== "/messages";

  return (
    <AppLayout>
      <div className="flex h-[calc(100dvh-2.75rem)] md:h-dvh">
        {/* 대화 목록 - 데스크탑 항상 표시, 모바일은 대화 열려있으면 숨김 */}
        <div
          className={`w-full md:w-80 md:shrink-0 md:border-r md:block ${
            isConversationOpen ? "hidden" : "block"
          }`}
        >
          <ConversationList />
        </div>

        {/* 채팅 영역 - 데스크탑 항상 표시, 모바일은 대화 열려있을 때만 표시 */}
        <div
          className={`flex-1 min-w-0 ${
            isConversationOpen ? "block" : "hidden md:block"
          }`}
        >
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
