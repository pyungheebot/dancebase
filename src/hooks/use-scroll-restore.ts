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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
