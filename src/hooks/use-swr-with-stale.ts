"use client";

import useSWR, { type SWRConfiguration, type BareFetcher } from "swr";

/**
 * useSWR 래퍼 - stale 데이터 존재 여부를 함께 반환합니다.
 *
 * SWR은 재검증 실패 시 이전 data를 유지하면서 error도 함께 설정합니다.
 * 이 훅은 그 상태를 명시적인 isStale 플래그로 표현하여
 * 컴포넌트가 "에러 화면 대신 stale 데이터 + 경고 배너" 패턴을 쉽게 구현하도록 돕습니다.
 *
 * 상태 조합:
 *   isLoading (true)  = 최초 로딩 중. data와 error 모두 없음.
 *   isStale   (true)  = 캐시된 data가 있지만 최신 검증에 실패함.
 *   정상       (둘 다 false) = data가 있고 error 없음.
 */
export function useSwrWithStale<T>(
  key: string | null,
  fetcher?: BareFetcher<T> | null,
  config?: SWRConfiguration<T>
) {
  const { data, error, isValidating, mutate } = useSWR<T>(
    key,
    fetcher as BareFetcher<T> | null,
    config
  );

  return {
    data,
    error,
    isValidating,
    mutate,
    /** 최초 로딩 중 (data도 error도 없는 상태) */
    isLoading: !data && !error,
    /** 캐시 데이터가 있지만 최신 검증에 실패한 상태 */
    isStale: !!data && !!error,
    /** SWR mutate를 래핑한 재시도 함수 */
    retry: () => mutate(),
  };
}
