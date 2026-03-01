"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import {
  WifiOff,
  ShieldAlert,
  SearchX,
  ServerCrash,
  AlertTriangle,
  RefreshCw,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import logger from "@/lib/logger";
import { categorizeError, getErrorMessage, type ErrorCategory } from "@/lib/error-category";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  cardName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  category: ErrorCategory;
  isRetrying: boolean;
}

const ICON_MAP = {
  WifiOff,
  ShieldAlert,
  SearchX,
  ServerCrash,
  AlertTriangle,
} as const;

type IconName = keyof typeof ICON_MAP;

const CATEGORY_COLORS: Record<ErrorCategory, string> = {
  network: "text-orange-500",
  auth: "text-red-500",
  "not-found": "text-muted-foreground",
  server: "text-destructive",
  unknown: "text-destructive",
};

const CATEGORY_BG: Record<ErrorCategory, string> = {
  network: "border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20",
  auth: "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
  "not-found": "border-border bg-muted/30",
  server: "border-destructive/20 bg-destructive/5",
  unknown: "border-destructive/20 bg-destructive/5",
};

export class CardErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  state: State = { hasError: false, category: "unknown", isRetrying: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const category = categorizeError(error);
    return { hasError: true, error, category };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `${this.props.cardName || "Unknown"}: ${error.message}`,
      "CardErrorBoundary",
      errorInfo
    );

    // 네트워크/서버 에러는 3초 후 1회 자동 재시도
    const category = categorizeError(error);
    if (category === "network" || category === "server") {
      this.retryTimer = setTimeout(() => {
        if (this.state.hasError) {
          this.handleRetry();
        }
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.setState({ hasError: false, error: undefined, category: "unknown", isRetrying: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { category, error } = this.state;
      const errorInfo = getErrorMessage(category);
      const IconComponent = ICON_MAP[errorInfo.icon as IconName] ?? AlertTriangle;
      const iconColor = CATEGORY_COLORS[category];
      const bgClass = CATEGORY_BG[category];

      return (
        <div className={`rounded-lg border p-4 ${bgClass}`}>
          <div className="flex items-start gap-3">
            <IconComponent className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{errorInfo.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{errorInfo.description}</p>

              {/* 개발 환경 에러 상세 */}
              {process.env.NODE_ENV === "development" && error?.message && (
                <details className="mt-2">
                  <summary className="text-[10px] text-muted-foreground cursor-pointer select-none">
                    에러 상세
                  </summary>
                  <code className="block text-[10px] bg-background/60 px-2 py-1.5 rounded mt-1 break-all whitespace-pre-wrap">
                    {error.message}
                  </code>
                </details>
              )}

              <div className="flex items-center gap-2 mt-2">
                {errorInfo.canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    다시 시도
                  </button>
                )}
                {category === "auth" && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    <LogIn className="h-3 w-3" />
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
