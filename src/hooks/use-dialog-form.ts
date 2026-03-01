"use client";

import { useState, useCallback, useRef } from "react";

/**
 * 다이얼로그 + 폼 상태 통합 관리 훅
 * open/close, 폼 값 관리, reset을 한 곳에서 처리
 *
 * @param defaultValues - 폼 초기값 (마운트 시점의 값이 기준, 이후 변경 무시)
 * @param options.onClose - 다이얼로그가 닫힐 때 실행할 추가 콜백
 * @param options.resetOnClose - true(기본)이면 닫힐 때 values를 defaultValues로 자동 리셋
 */
export function useDialogForm<T extends Record<string, unknown>>(
  defaultValues: T,
  options?: {
    onClose?: () => void;
    resetOnClose?: boolean;
  }
) {
  // defaultValues는 마운트 시점 값만 사용 (매 렌더 새 객체 생성 방어)
  const defaultsRef = useRef<T>(defaultValues);
  const onCloseRef = useRef(options?.onClose);
  onCloseRef.current = options?.onClose;

  const resetOnClose = options?.resetOnClose ?? true;

  const [open, setOpen] = useState(false);
  const [values, setValuesState] = useState<T>(() => defaultsRef.current);

  const reset = useCallback(() => {
    setValuesState(defaultsRef.current);
  }, []);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setValues = useCallback((updates: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && resetOnClose) {
        setValuesState(defaultsRef.current);
      }
      setOpen(nextOpen);
      if (!nextOpen) {
        onCloseRef.current?.();
      }
    },
    [resetOnClose]
  );

  return {
    open,
    setOpen,
    values,
    setValue,
    setValues,
    reset,
    handleOpenChange,
  };
}
