"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import logger from "@/lib/logger";

interface PageErrorProps {
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
}

export function PageError({ title, error, reset }: PageErrorProps) {
  useEffect(() => {
    logger.error(error.message, "PageError", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-3 max-w-md">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          오류가 발생했습니다. 다시 시도해주세요.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <code className="block text-xs bg-muted px-3 py-2 rounded text-left break-all">
            {error.message}
          </code>
        )}
        {error.digest && (
          <p className="text-xs text-muted-foreground">오류 코드: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm">다시 시도</Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">홈으로</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
