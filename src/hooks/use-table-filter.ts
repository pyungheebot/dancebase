"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryParams } from "@/hooks/use-query-params";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * 테이블/목록 필터 + 검색 상태 통합 관리 훅
 *
 * - URL 쿼리 파라미터 동기화 (useQueryParams 기반)
 * - 검색어 디바운싱 (useDebounce 기반)
 * - searchKey에 해당하는 필드는 로컬 입력(즉시 반응) + 디바운스 후 URL 반영
 * - setFilter(key, value)로 개별 필터 변경
 * - resetFilters()로 기본값으로 초기화
 * - hasActiveFilters로 기본값과 다른 활성 필터 존재 여부 확인
 */
export function useTableFilter<T extends Record<string, string>>(
  defaultFilters: T,
  options?: {
    /** 검색 필드 키 (기본: "q"). 해당 키는 디바운싱 처리됨 */
    searchKey?: string;
    /** 디바운스 시간(ms). 기본 300ms */
    debounceMs?: number;
  }
) {
  const searchKey = options?.searchKey ?? "q";
  const debounceMs = options?.debounceMs ?? 300;

  // URL 쿼리 파라미터와 양방향 동기화
  const [urlParams, setUrlParams] = useQueryParams(defaultFilters);

  // 검색 입력은 로컬 state로 관리하여 타이핑 즉시 반영
  const [searchInput, setSearchInput] = useState<string>(
    urlParams[searchKey as keyof T] ?? ""
  );

  // 디바운싱된 검색어 (실제 필터링에 사용)
  const debouncedSearch = useDebounce(searchInput, debounceMs);

  // 디바운싱된 검색어가 바뀔 때만 URL 업데이트
  useEffect(() => {
    const currentUrlSearch = urlParams[searchKey as keyof T] ?? "";
    if (debouncedSearch !== currentUrlSearch) {
      setUrlParams({ [searchKey]: debouncedSearch } as Partial<T>);
    }
    // urlParams.q 변경으로 인한 무한루프 방지 — 의도적으로 urlParams 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // URL의 searchKey가 외부에서 변경되면 로컬 입력도 동기화 (뒤로가기 등)
  useEffect(() => {
    const urlSearch = urlParams[searchKey as keyof T] ?? "";
    setSearchInput(urlSearch);
    // urlParams 전체를 의존성에 넣으면 무한루프 가능성 → searchKey 값만 추적
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams[searchKey as keyof T]]);

  /**
   * 개별 필터 변경
   * - searchKey 필드는 로컬 입력(searchInput)을 통해 변경해야 URL이 디바운싱됨
   * - 다른 필드는 즉시 URL에 반영
   */
  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      if (key === searchKey) {
        // 검색 필드는 로컬 state 업데이트 → useEffect에서 디바운스 후 URL 반영
        setSearchInput(value as string);
      } else {
        setUrlParams({ [key]: value } as unknown as Partial<T>);
      }
    },
    [searchKey, setUrlParams]
  );

  /**
   * 전체 필터 초기화 (기본값으로 복원)
   */
  const resetFilters = useCallback(() => {
    setUrlParams(defaultFilters);
    setSearchInput(defaultFilters[searchKey as keyof T] ?? "");
  }, [defaultFilters, searchKey, setUrlParams]);

  /**
   * 현재 활성 필터가 기본값과 다른지 여부
   * - 검색어는 debouncedSearch 기준으로 비교
   * - 나머지는 URL 파라미터 기준으로 비교
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(defaultFilters).some((key) => {
      if (key === searchKey) {
        return debouncedSearch !== (defaultFilters[key as keyof T] ?? "");
      }
      return urlParams[key as keyof T] !== defaultFilters[key as keyof T];
    });
  }, [defaultFilters, searchKey, debouncedSearch, urlParams]);

  // 현재 필터 값 (URL 동기화된 값 + searchKey는 debouncedSearch로 덮어쓰기)
  const filters = useMemo(() => {
    return {
      ...urlParams,
      [searchKey]: debouncedSearch,
    } as T;
  }, [urlParams, searchKey, debouncedSearch]);

  return {
    /** 현재 필터값 (URL 동기화된 값, searchKey는 디바운싱된 값) */
    filters,
    /** 개별 필터 설정 (searchKey는 로컬 입력 → 디바운스 후 URL 반영) */
    setFilter,
    /** 전체 필터 초기화 */
    resetFilters,
    /** 로컬 검색 입력값 (디바운스 전, Input value에 바인딩) */
    searchInput,
    /** 검색 입력 직접 변경 (Input onChange에 바인딩) */
    setSearchInput,
    /** 디바운싱된 검색어 (실제 필터링 로직에 사용) */
    debouncedSearch,
    /** 기본값과 다른 활성 필터가 하나라도 있는지 여부 */
    hasActiveFilters,
  };
}
