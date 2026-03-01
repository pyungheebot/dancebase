import type { SWRConfiguration } from "swr";

/**
 * SWR 글로벌 기본값
 *
 * revalidateOnFocus: true  → 탭 복귀 시 자동 재검증 (기본 ON)
 *   - 실시간성이 필요한 훅(messages, notifications 등)은 이 값을 상속받음
 *   - 정적 데이터 훅(설정, 그룹 메타 등)은 개별적으로 false 오버라이드
 *
 * dedupingInterval: 5000   → 5초 내 동일 키 중복 요청 차단
 * keepPreviousData: true   → 키 변경 시 이전 데이터 유지(UX 깜빡임 방지)
 */
export const swrConfig: SWRConfiguration = {
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  onError: (error, key) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[SWR] ${key}:`, error);
    }
  },
};
