"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UseCopyToClipboardOptions {
  successMessage?: string | null;
  errorMessage?: string | null;
  resetDelay?: number;
}

interface UseCopyToClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

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
