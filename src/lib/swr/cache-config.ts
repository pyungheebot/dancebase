import type { SWRConfiguration } from "swr";

/**
 * 도메인별 SWR 캐시 설정 프리셋
 *
 * 적용 기준:
 *   realtimeConfig   - Realtime 구독 + 탭 복귀 즉시 갱신 필요 (메시지, 알림 등)
 *   frequentConfig   - 탭 복귀 시 갱신하되 dedupingInterval 늘림 (일정, 출석, 게시판 등)
 *   staticConfig     - 탭 복귀 갱신 불필요, 변경 시 직접 invalidate (그룹 메타, 설정, 프로필 등)
 *   immutableConfig  - 세션 중 거의 변하지 않는 데이터 (카테고리, 역할 목록, 조상 트리 등)
 */

/** 실시간 데이터 — Realtime 구독이 있고 탭 복귀 시 즉시 갱신이 필요한 훅 */
export const realtimeConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  dedupingInterval: 2000,
};

/** 준실시간 데이터 — 탭 복귀 시 갱신하되 중복 요청 간격을 10초로 늘림 */
export const frequentConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  dedupingInterval: 10000,
};

/** 정적 데이터 — 탭 복귀 시 refetch 안 함, 재연결 시만 갱신 */
export const staticConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 30000,
  revalidateOnReconnect: true,
};

/** 불변 데이터 — 세션 중 변하지 않으므로 재연결 시에도 갱신 안 함 */
export const immutableConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000,
};
