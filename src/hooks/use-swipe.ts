"use client";
import { useRef, useCallback } from "react";

type SwipeDirection = "left" | "right" | "up" | "down";
type SwipeOptions = {
  onSwipe: (direction: SwipeDirection) => void;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
};

export function useSwipe({
  onSwipe,
  threshold = 50,
  preventScrollOnSwipe = false,
}: SwipeOptions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      if (!preventScrollOnSwipe) return;

      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      // 수평 이동이 수직보다 크면 스크롤 방지
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    },
    [preventScrollOnSwipe]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      startX.current = null;
      startY.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // threshold 미만이면 무시
      if (absDx < threshold && absDy < threshold) return;

      // 수평/수직 중 더 큰 쪽을 기준으로 방향 결정
      if (absDx >= absDy) {
        onSwipe(dx < 0 ? "left" : "right");
      } else {
        onSwipe(dy < 0 ? "up" : "down");
      }
    },
    [onSwipe, threshold]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
