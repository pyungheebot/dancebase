"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <WifiOff className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-xl font-semibold">오프라인 상태</h1>
      <p className="text-sm text-muted-foreground text-center">
        인터넷 연결이 없습니다. 연결을 확인하고 다시 시도해주세요.
      </p>
      <Button variant="outline" size="sm" onClick={() => location.reload()}>
        새로고침
      </Button>
    </div>
  );
}
