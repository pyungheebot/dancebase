"use client";

import { use } from "react";
import { ChatView } from "@/components/messages/chat-view";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  return <ChatView partnerId={userId} />;
}
