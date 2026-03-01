"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

/** 클립보드 복사 훅 옵션 */
interface UseCopyToClipboardOptions {
  /** 복사 성공 시 표시할 토스트 메시지. null 전달 시 토스트 비활성화 */
  successMessage?: string | null;
  /** 복사 실패 시 표시할 토스트 메시지. null 전달 시 토스트 비활성화 */
  errorMessage?: string | null;
  /** copied 상태를 false로 되돌리기까지의 딜레이 (ms, 기본값: 2000) */
  resetDelay?: number;
}

/** 클립보드 복사 훅 반환값 */
interface UseCopyToClipboardReturn {
  /** 복사 성공 후 resetDelay 동안 true로 유지되는 상태 */
  copied: boolean;
  /** 텍스트를 클립보드에 복사. 성공 여부를 boolean으로 반환 */
  copy: (text: string) => Promise<boolean>;
  /** copied 상태를 즉시 false로 초기화 */
  reset: () => void;
}

/**
 * 클립보드 복사 기능과 상태를 관리하는 훅
 * @param options - 토스트 메시지, 리셋 딜레이 커스터마이징
 * @returns copied 상태, copy 함수, reset 함수
 * @example
 * const { copied, copy } = useCopyToClipboard();
 * // <button onClick={() => copy("텍스트")}>{copied ? "복사됨" : "복사"}</button>
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const {
    successMessage = "복사되었습니다",
    errorMessage = "복사에 실패했습니다",
    resetDelay = 2000,
  } = options;

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    clearTimeout(timerRef.current);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (successMessage !== null) {
          toast.success(successMessage);
        }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch {
        if (errorMessage !== null) {
          toast.error(errorMessage);
        }
        return false;
      }
    },
    [successMessage, errorMessage, resetDelay]
  );

  return { copied, copy, reset };
}
