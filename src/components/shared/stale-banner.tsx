"use client";

import { WifiOff, ServerCrash, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { categorizeError } from "@/lib/error-category";

interface StaleBannerProps {
  error: unknown;
  isValidating: boolean;
  onRetry?: () => void;
}

/**
 * SWR 에러 발생 시 stale 데이터가 있을 때 상단에 표시하는 배너.
 * data + error 가 동시에 존재하는 SWR 상태(stale)를 전제로 사용합니다.
 *
 * - error 없음: 렌더링하지 않음
 * - isValidating=true: "새로고침 중..." 스피너만 표시
 * - isValidating=false + error 있음: 에러 카테고리별 메시지 + 다시 시도 버튼
 */
export function StaleBanner({ error, isValidating, onRetry }: StaleBannerProps) {
  // 에러가 없으면 아무것도 렌더링하지 않음
  if (!error) return null;

  const category = categorizeError(error);

  const { icon: Icon, message } = (() => {
    switch (category) {
      case "network":
        return {
          icon: WifiOff,
          message: "인터넷 연결을 확인해주세요. 마지막 저장된 데이터를 표시합니다.",
        };
      case "server":
        return {
          icon: ServerCrash,
          message: "서버에 일시적인 문제가 있습니다. 마지막 저장된 데이터를 표시합니다.",
        };
      default:
        return {
          icon: AlertTriangle,
          message: "데이터를 불러오는 중 문제가 발생했습니다. 마지막 저장된 데이터를 표시합니다.",
        };
    }
  })();

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200 animate-in slide-in-from-top-2 duration-300"
    >
      {isValidating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          <span>새로고침 중...</span>
        </>
      ) : (
        <>
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              aria-label="데이터 다시 불러오기"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              다시 시도
            </button>
          )}
        </>
      )}
    </div>
  );
}
