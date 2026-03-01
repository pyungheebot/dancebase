"use client";

import React from "react";
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

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  category: ErrorCategory;
  stackOpen: boolean;
};

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
  unknown: "text-destructive/70",
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, category: "unknown", stackOpen: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const category = categorizeError(error);
    return { hasError: true, error, category };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(error.message, "ErrorBoundary", info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, category: "unknown", stackOpen: false });
  };

  toggleStack = () => {
    this.setState((prev) => ({ stackOpen: !prev.stackOpen }));
  };

  handleReport = () => {
    const { error, category } = this.state;
    const subject = encodeURIComponent(`[오류 신고] ${getErrorMessage(category).title}`);
    const body = encodeURIComponent(
      `오류 메시지: ${error?.message ?? "알 수 없음"}\n\n발생 시각: ${new Date().toLocaleString("ko-KR")}`
    );
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, "_blank");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { category, error, stackOpen } = this.state;
      const errorInfo = getErrorMessage(category);
      const IconComponent = ICON_MAP[errorInfo.icon as IconName] ?? AlertTriangle;
      const iconColor = CATEGORY_ICON_COLOR[category];
      const isDev = process.env.NODE_ENV === "development";

      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
          <IconComponent className={`h-10 w-10 ${iconColor}`} />

          <div className="space-y-1.5">
            <p className="text-base font-semibold">{errorInfo.title}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{errorInfo.description}</p>
          </div>

          {/* 개발 환경: 에러 메시지 + 스택 접기/펼치기 */}
          {isDev && error && (
            <div className="w-full max-w-md text-left">
              <code className="block text-xs bg-muted px-3 py-2 rounded break-all">
                {error.message}
              </code>
              {error.stack && (
                <div className="mt-1">
                  <button
                    onClick={this.toggleStack}
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

          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {errorInfo.canRetry && (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                다시 시도
              </Button>
            )}
            {category === "auth" && (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs gap-1.5"
                asChild
              >
                <Link href="/login">로그인</Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              asChild
            >
              <Link href="/dashboard">
                <Home className="h-3.5 w-3.5" />
                홈으로
              </Link>
            </Button>
            {!errorInfo.canRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                다시 시도
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground"
              onClick={this.handleReport}
            >
              <MessageSquareWarning className="h-3.5 w-3.5" />
              문제 신고
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
