"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { removeFromStorage } from "@/lib/local-storage";

export interface FormDraftData {
  title: string;
  content: string;
}

interface UseFormDraftOptions {
  key: string;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseFormDraftReturn {
  hasDraft: boolean;
  restoreDraft: () => FormDraftData | null;
  saveDraft: (data: FormDraftData) => void;
  clearDraft: () => void;
  isDraftRestored: boolean;
}

export function useFormDraft({
  key,
  enabled = true,
  debounceMs = 3000,
}: UseFormDraftOptions): UseFormDraftReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedChanges = useRef(false);

  // 마운트 시 드래프트 존재 여부 확인

  // 페이지 이탈 경고
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const saveDraft = useCallback(
    (data: FormDraftData) => {
      if (!enabled) return;

      hasUnsavedChanges.current = true;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        try {
          if (data.title?.trim() || data.content?.trim()) {
            localStorage.setItem(key, JSON.stringify(data));
            setHasDraft(true);
            toast("임시 저장됨", {
              description: "작성 중인 내용이 임시 저장되었습니다.",
              duration: 2000,
            });
          }
        } catch {
          // localStorage 쓰기 실패 시 무시
        }
      }, debounceMs);
    },
    [key, enabled, debounceMs]
  );

  const restoreDraft = useCallback((): FormDraftData | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as FormDraftData;
      setIsDraftRestored(true);
      hasUnsavedChanges.current = false;
      return parsed;
    } catch {
      return null;
    }
  }, [key, enabled]);

  const clearDraft = useCallback(() => {
    if (!enabled) return;

    try {
      removeFromStorage(key);
      setHasDraft(false);
      setIsDraftRestored(false);
      hasUnsavedChanges.current = false;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    } catch {
      // 무시
    }
  }, [key, enabled]);

  return {
    hasDraft,
    restoreDraft,
    saveDraft,
    clearDraft,
    isDraftRestored,
  };
}
