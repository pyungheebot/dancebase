"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 목록 페이지의 스크롤 위치를 sessionStorage에 저장하고,
 * 컴포넌트 마운트 시 저장된 위치로 자동 복원하는 훅.
 *
 * - 스크롤 이벤트는 debounce(300ms) 적용
 * - 복원은 requestAnimationFrame으로 렌더링 완료 후 실행
 * - sessionStorage 키: `scroll-${pathname}`
 *
 * window.scrollY 기반으로 동작하므로 AppLayout 내 페이지 컴포넌트에서 사용.
 */
export function useScrollRestore() {
  const pathname = usePathname();
  const storageKey = `scroll-${pathname}`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // 마운트 시 저장된 스크롤 위치 복원
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;

    const savedY = Number(saved);
    if (!Number.isFinite(savedY) || savedY <= 0) return;

    // 렌더링 완료 후 스크롤 복원
    rafRef.current = requestAnimationFrame(() => {
      window.scrollTo({ top: savedY, behavior: "instant" });
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [storageKey]);

  // 스크롤 이벤트 리스너 등록 (debounce 300ms)
  useEffect(() => {
    const handleScroll = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [storageKey]);
}

/**
 * ScrollArea 등 커스텀 스크롤 컨테이너의 스크롤 위치를 복원하는 훅.
 *
 * - window.scrollY 대신 element.scrollTop 사용
 * - storageKey 파라미터로 고유 키를 직접 지정
 * - 반환된 ref를 스크롤 컨테이너 DOM 요소에 연결
 *
 * @param storageKey sessionStorage에 저장할 고유 키
 * @returns ref - 스크롤 컨테이너 엘리먼트에 연결할 ref
 */
export function useScrollRestoreRef(storageKey: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // 마운트 시 저장된 스크롤 위치 복원
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;

    const savedY = Number(saved);
    if (!Number.isFinite(savedY) || savedY <= 0) return;

    rafRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = savedY;
      }
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [storageKey]);

  // 스크롤 이벤트 리스너 등록 (debounce 300ms)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        sessionStorage.setItem(storageKey, String(container.scrollTop));
      }, 300);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [storageKey]);

  return containerRef;
}
