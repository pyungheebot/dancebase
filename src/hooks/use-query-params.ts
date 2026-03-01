"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * URL 쿼리 파라미터 <-> state 양방향 동기화 훅
 *
 * @param defaults - 기본값 객체 (키-값 모두 string)
 * @returns [params, setParams] - 현재 값 + 업데이트 함수
 *
 * 규칙:
 * - 기본값과 동일하거나 빈 문자열("")인 값은 URL에서 제거 (깔끔한 URL)
 * - router.replace() 사용으로 히스토리 스택 오염 방지
 * - scroll: false로 스크롤 위치 유지
 */
export function useQueryParams<T extends Record<string, string>>(
  defaults: T
): [T, (updates: Partial<T>) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 현재 URL 파라미터와 기본값을 병합하여 현재 상태 구성
  const params = Object.fromEntries(
    Object.keys(defaults).map((key) => {
      const urlValue = searchParams.get(key);
      return [key, urlValue !== null ? urlValue : defaults[key as keyof T]];
    })
  ) as T;

  const setParams = useCallback(
    (updates: Partial<T>) => {
      // 현재 URL 파라미터 복사
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const strValue = value as string;
        // 빈 문자열이거나 기본값과 동일하면 URL에서 제거
        if (strValue === "" || strValue === defaults[key as keyof T]) {
          next.delete(key);
        } else {
          next.set(key, strValue);
        }
      });

      const queryString = next.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(url, { scroll: false });
    },
    [searchParams, pathname, router, defaults]
  );

  return [params, setParams];
}
