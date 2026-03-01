"use client";

import { useState, useEffect, useCallback } from "react";

interface UseFormRecoveryOptions<T> {
  onRestore?: (state: T) => void;
}

interface UseFormRecoveryReturn {
  saveOnError: () => void;
  clearSaved: () => void;
  hasSavedData: boolean;
  restore: () => void;
  dismiss: () => void;
}

/**
 * 폼 제출 실패 시 입력값을 sessionStorage에 저장하고,
 * 다음 마운트 시 복구를 제안하는 훅.
 *
 * @param key          고유 키 (예: "schedule-form-groupId-xxx")
 * @param currentState 현재 폼 상태 (JSON 직렬화 가능한 값만 포함)
 * @param options      onRestore: 복구 시 상태를 폼에 반영하는 콜백
 */
export function useFormRecovery<T>(
  key: string,
  currentState: T,
  options?: UseFormRecoveryOptions<T>
): UseFormRecoveryReturn {
  const [hasSavedData, setHasSavedData] = useState(false);

  // 마운트 시 sessionStorage에 해당 key가 존재하는지 확인
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(key);
      setHasSavedData(raw !== null);
    } catch {
      setHasSavedData(false);
    }
  }, [key]);

  // 제출 실패 시 호출 → 현재 상태를 sessionStorage에 저장
  const saveOnError = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(key, JSON.stringify(currentState));
      setHasSavedData(true);
    } catch {
      // sessionStorage 쓰기 실패 시 무시 (용량 초과 등)
    }
  }, [key, currentState]);

  // 제출 성공 시 호출 → 저장된 데이터 삭제
  const clearSaved = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(key);
      setHasSavedData(false);
    } catch {
      // 무시
    }
  }, [key]);

  // 저장된 데이터를 파싱하여 onRestore 콜백 호출 + 데이터 삭제
  const restore = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return;
      const parsed = JSON.parse(raw) as T;
      options?.onRestore?.(parsed);
      sessionStorage.removeItem(key);
      setHasSavedData(false);
    } catch {
      // 파싱 실패 시 데이터 삭제만 수행
      try {
        sessionStorage.removeItem(key);
      } catch {
        // 무시
      }
      setHasSavedData(false);
    }
  }, [key, options]);

  // 복구 제안 무시 → 데이터만 삭제
  const dismiss = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(key);
      setHasSavedData(false);
    } catch {
      // 무시
    }
  }, [key]);

  return {
    saveOnError,
    clearSaved,
    hasSavedData,
    restore,
    dismiss,
  };
}
