"use client";

import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">
      <MessageCircle className="h-16 w-16 mb-4 stroke-1" />
      <p className="text-lg font-medium">내 메시지</p>
      <p className="text-sm mt-1">대화를 선택하여 메시지를 확인하세요</p>
    </div>
  );
}
