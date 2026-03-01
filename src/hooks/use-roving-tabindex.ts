"use client";

import { useState, useRef, useCallback } from "react";

type Orientation = "horizontal" | "vertical" | "both";

type RovingTabIndexOptions = {
  itemCount: number;
  orientation?: Orientation;
  /** 끝에서 처음으로 순환 여부 (기본 true) */
  loop?: boolean;
  /** Enter 또는 Space로 항목 선택 시 호출 */
  onSelect?: (index: number) => void;
};

type ItemProps = {
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  ref: (el: HTMLElement | null) => void;
};

type ContainerProps = {
  role: string;
  "aria-orientation": Orientation;
};

type RovingTabIndexResult = {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getItemProps: (index: number) => ItemProps;
  containerProps: ContainerProps;
};

/**
 * 로빙 탭인덱스 패턴
 * - 컨테이너 내 항목 중 하나만 tabIndex=0 (나머지 -1)
 * - Arrow 키로 포커스 이동, Home/End로 처음/끝 이동
 * - loop=true 시 끝에서 처음으로 순환
 */
export function useRovingTabIndex({
  itemCount,
  orientation = "vertical",
  loop = true,
  onSelect,
}: RovingTabIndexOptions): RovingTabIndexResult {
  const [activeIndex, setActiveIndex] = useState(0);
  // 각 항목 DOM 요소 보관
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const focusItem = useCallback((index: number) => {
    setActiveIndex(index);
    // 다음 렌더 후 실제 DOM 포커스
    requestAnimationFrame(() => {
      itemRefs.current[index]?.focus();
    });
  }, []);

  const handleKeyDown = useCallback(
    (currentIndex: number) => (e: React.KeyboardEvent) => {
      if (itemCount === 0) return;

      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal =
        orientation === "horizontal" || orientation === "both";

      let next: number | null = null;

      switch (e.key) {
        case "ArrowDown":
          if (!isVertical) break;
          e.preventDefault();
          next =
            currentIndex < itemCount - 1
              ? currentIndex + 1
              : loop
                ? 0
                : currentIndex;
          break;

        case "ArrowUp":
          if (!isVertical) break;
          e.preventDefault();
          next =
            currentIndex > 0
              ? currentIndex - 1
              : loop
                ? itemCount - 1
                : currentIndex;
          break;

        case "ArrowRight":
          if (!isHorizontal) break;
          e.preventDefault();
          next =
            currentIndex < itemCount - 1
              ? currentIndex + 1
              : loop
                ? 0
                : currentIndex;
          break;

        case "ArrowLeft":
          if (!isHorizontal) break;
          e.preventDefault();
          next =
            currentIndex > 0
              ? currentIndex - 1
              : loop
                ? itemCount - 1
                : currentIndex;
          break;

        case "Home":
          e.preventDefault();
          next = 0;
          break;

        case "End":
          e.preventDefault();
          next = itemCount - 1;
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          onSelect?.(currentIndex);
          break;
      }

      if (next !== null && next !== currentIndex) {
        focusItem(next);
      }
    },
    [itemCount, orientation, loop, onSelect, focusItem]
  );

  const getItemProps = useCallback(
    (index: number): ItemProps => ({
      tabIndex: activeIndex === index ? 0 : -1,
      onKeyDown: handleKeyDown(index),
      onFocus: () => setActiveIndex(index),
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
    }),
    [activeIndex, handleKeyDown]
  );

  const containerProps: ContainerProps = {
    role: "listbox",
    "aria-orientation": orientation === "both" ? "vertical" : orientation,
  };

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
    containerProps,
  };
}
