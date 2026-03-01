import type { SWRConfiguration } from "swr";
import { shouldRetryOnError, retryDelay, isAuthError } from "./error-handler";
import logger from "@/lib/logger";

/**
 * SWR 글로벌 기본값
 *
 * revalidateOnFocus: true  → 탭 복귀 시 자동 재검증 (기본 ON)
 *   - 실시간성이 필요한 훅(messages, notifications 등)은 이 값을 상속받음
 *   - 정적 데이터 훅(설정, 그룹 메타 등)은 개별적으로 false 오버라이드
 *
 * dedupingInterval: 5000   → 5초 내 동일 키 중복 요청 차단
 * keepPreviousData: true   → 키 변경 시 이전 데이터 유지(UX 깜빡임 방지)
 *
 * onErrorRetry            → exponential backoff 자동 재시도
 *   - 인증/404/AbortError는 재시도 스킵
 *   - 네트워크/서버 에러(5xx)는 최대 3회, 1s→3s→9s 간격으로 재시도
 */
export const swrConfig: SWRConfiguration = {
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  onError: (error, key) => {
    // 인증 에러는 auth provider에서 처리하므로 무시
    if (isAuthError(error)) return;
    logger.error(`${key}:`, "SWR", error);
  },
  // SWR 내장 재시도를 비활성화하고 onErrorRetry로 직접 제어
  shouldRetryOnError: true,
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    if (!shouldRetryOnError(error, retryCount)) return;
    setTimeout(() => revalidate({ retryCount }), retryDelay(retryCount));
  },
};
