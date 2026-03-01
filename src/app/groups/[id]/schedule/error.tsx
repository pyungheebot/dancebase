"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-3 max-w-md">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-lg font-semibold">일정을 불러올 수 없습니다</h2>
        <p className="text-sm text-muted-foreground">
          일정을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <Button onClick={reset} size="sm">다시 시도</Button>
      </div>
    </div>
  );
}
