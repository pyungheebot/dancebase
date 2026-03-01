"use client";

import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormRecoveryBannerProps {
  onRestore: () => void;
  onDismiss: () => void;
}

/**
 * 이전 입력값 복구 제안 배너.
 * hasSavedData가 true일 때 폼 상단에 조건부 렌더링합니다.
 */
export function FormRecoveryBanner({
  onRestore,
  onDismiss,
}: FormRecoveryBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-200 animate-in slide-in-from-top-2 duration-300"
    >
      <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">이전에 작성하던 내용이 있습니다.</span>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/40"
          onClick={onRestore}
        >
          복구
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-100 dark:hover:bg-blue-900/40"
          onClick={onDismiss}
          aria-label="복구 무시"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
