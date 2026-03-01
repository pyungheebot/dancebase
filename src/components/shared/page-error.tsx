"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  WifiOff,
  ShieldAlert,
  SearchX,
  ServerCrash,
  AlertTriangle,
  Home,
  RefreshCw,
  MessageSquareWarning,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import logger from "@/lib/logger";
import { categorizeError, getErrorMessage, type ErrorCategory } from "@/lib/error-category";

interface PageErrorProps {
  title?: string;
  error: Error & { digest?: string };
  reset: () => void;
}

const ICON_MAP = {
  WifiOff,
  ShieldAlert,
  SearchX,
  ServerCrash,
  AlertTriangle,
} as const;

type IconName = keyof typeof ICON_MAP;

const CATEGORY_ICON_COLOR: Record<ErrorCategory, string> = {
  network: "text-orange-500",
  auth: "text-red-500",
  "not-found": "text-muted-foreground",
  server: "text-destructive",
  unknown: "text-destructive",
};

export function PageError({ title, error, reset }: PageErrorProps) {
  const [stackOpen, setStackOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const category = categorizeError(error);
  const errorInfo = getErrorMessage(category);
  const IconComponent = ICON_MAP[errorInfo.icon as IconName] ?? AlertTriangle;
  const iconColor = CATEGORY_ICON_COLOR[category];
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    logger.error(error.message, "PageError", error);
  }, [error]);

  const handleReset = () => {
    setIsRetrying(true);
    // 짧은 지연 후 reset 호출 (UI 피드백)
    setTimeout(() => {
      setIsRetrying(false);
      reset();
    }, 300);
  };

  const handleReport = () => {
    const subject = encodeURIComponent(`[오류 신고] ${errorInfo.title}`);
    const body = encodeURIComponent(
      `오류 메시지: ${error.message}\n` +
      (error.digest ? `오류 코드: ${error.digest}\n` : "") +
      `\n발생 시각: ${new Date().toLocaleString("ko-KR")}`
    );
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="flex items-center justify-center p-8 min-h-[300px]">
      <div className="text-center space-y-4 max-w-md w-full">
        <IconComponent className={`h-12 w-12 mx-auto ${iconColor}`} aria-hidden="true" />

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">
            {title ?? errorInfo.title}
          </h2>
          <p className="text-sm text-muted-foreground">{errorInfo.description}</p>
        </div>

        {/* 오류 코드 */}
        {error.digest && (
          <p className="text-xs text-muted-foreground">오류 코드: {error.digest}</p>
        )}

        {/* 개발 환경: 에러 메시지 + 스택 접기/펼치기 */}
        {isDev && error.message && (
          <div className="text-left">
            <code className="block text-xs bg-muted px-3 py-2 rounded break-all">
              {error.message}
            </code>
            {error.stack && (
              <div className="mt-1">
                <button
                  onClick={() => setStackOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {stackOpen ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      스택 숨기기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      스택 펼치기
                    </>
                  )}
                </button>
                {stackOpen && (
                  <pre className="mt-1 text-[10px] bg-muted px-3 py-2 rounded overflow-auto max-h-48 text-left whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={handleReset}
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={isRetrying}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "재시도 중..." : "다시 시도"}
          </Button>

          {category === "auth" && (
            <Button size="sm" className="h-8 text-xs" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
            <Link href="/dashboard">
              <Home className="h-3.5 w-3.5" />
              홈으로
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-muted-foreground"
            onClick={handleReport}
          >
            <MessageSquareWarning className="h-3.5 w-3.5" />
            문제 신고
          </Button>
        </div>
      </div>
    </div>
  );
}
