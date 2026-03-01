"use client";

import { useCallback } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  /** 호버/포커스 시 실행할 SWR 프리로드 함수 */
  preloadFn?: () => void;
};

/**
 * Next.js Link를 래핑한 프리페치 링크 컴포넌트.
 *
 * onMouseEnter / onFocus 이벤트 발생 시 preloadFn을 호출하여
 * 목적지 페이지에 필요한 SWR 데이터를 미리 캐시에 적재한다.
 *
 * - preloadFn이 없으면 일반 Link와 동일하게 동작한다.
 * - 프리로드 실패 시 에러는 preload.ts 내부에서 사일런트 처리된다.
 */
export function PrefetchLink({
  href,
  preloadFn,
  onMouseEnter,
  onFocus,
  children,
  ...props
}: PrefetchLinkProps) {
  const handlePreload = useCallback(() => {
    preloadFn?.();
  }, [preloadFn]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      handlePreload();
      // 기존 onMouseEnter 핸들러도 실행
      if (typeof onMouseEnter === "function") {
        onMouseEnter(e);
      }
    },
    [handlePreload, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      handlePreload();
      // 기존 onFocus 핸들러도 실행
      if (typeof onFocus === "function") {
        onFocus(e);
      }
    },
    [handlePreload, onFocus]
  );

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
}
