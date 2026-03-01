"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseFormSubmissionOptions {
  /** 성공 시 표시할 토스트 메시지 (없으면 토스트 미표시) */
  successMessage?: string;
  /** 실패 시 표시할 기본 토스트 메시지 (없으면 에러 메시지 그대로 표시) */
  errorMessage?: string;
  /** 성공 후 실행할 콜백 */
  onSuccess?: () => void;
  /** 실패 후 실행할 콜백 */
  onError?: (error: Error) => void;
}

interface UseFormSubmissionReturn {
  /** 제출 진행 중 여부 */
  pending: boolean;
  /** 마지막 에러 메시지 (없으면 null) */
  localError: string | null;
  /**
   * 비동기 함수를 실행하면서 pending/error/toast를 자동 처리합니다.
   * 컴포넌트당 평균 15줄의 try-catch + toast 코드를 1줄의 submit() 호출로 대체합니다.
   *
   * @example
   * await submit(async () => {
   *   const { error } = await supabase.from("...").insert({...});
   *   if (error) throw error;
   * });
   */
  submit: <T>(asyncFn: () => Promise<T>) => Promise<T | undefined>;
  /** localError를 초기화합니다 */
  clearError: () => void;
}

/**
 * 폼 제출 공통 패턴을 캡슐화하는 훅.
 *
 * useAsyncAction과 별도로 존재하며 기존 코드 호환성을 유지합니다.
 * 성공/실패 시 toast 자동 호출 + pending 상태 관리 + localError 노출이 핵심입니다.
 */
export function useFormSubmission(
  options?: UseFormSubmissionOptions
): UseFormSubmissionReturn {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 중복 제출 방지를 위해 ref로 pending 추적 (클로저 문제 방지)
  const pendingRef = useRef(false);

  const submit = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | undefined> => {
      // 이미 진행 중이면 무시
      if (pendingRef.current) return undefined;

      pendingRef.current = true;
      setPending(true);
      setLocalError(null);

      try {
        const result = await asyncFn();

        // 성공 처리
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        options?.onSuccess?.();

        return result;
      } catch (err) {
        // 에러 메시지 추출
        const errorMsg =
          options?.errorMessage ??
          (err instanceof Error ? err.message : "요청 처리 중 오류가 발생했습니다");

        setLocalError(errorMsg);
        toast.error(errorMsg);

        // 에러 콜백 실행
        options?.onError?.(err instanceof Error ? err : new Error(errorMsg));

        return undefined;
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    },
    // options는 매 렌더마다 새 객체일 수 있으므로 개별 값 대신 안정적으로 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      options?.successMessage,
      options?.errorMessage,
      options?.onSuccess,
      options?.onError,
    ]
  );

  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return { pending, localError, submit, clearError };
}
