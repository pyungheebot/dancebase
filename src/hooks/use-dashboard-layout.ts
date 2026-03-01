"use client";

import { useState, useCallback } from "react";
import type {
  DashboardWidgetId,
  DashboardWidgetItem,
  DashboardLayout,
  DashboardWidgetDirection,
} from "@/types";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
} from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY = "dancebase:dashboard-layout";

// ============================================
// localStorage 헬퍼
// ============================================

function loadLayoutFromStorage(): DashboardLayout {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_DASHBOARD_LAYOUT;

    const saved = parsed as DashboardWidgetItem[];
    const allIds = DASHBOARD_WIDGETS.map((w) => w.id);

    // 저장된 항목 중 유효한 ID만 유지
    const merged: DashboardLayout = saved.filter((item) =>
      allIds.includes(item.id)
    );

    // 새로 추가된 위젯(저장 목록에 없는 위젯)을 뒤에 추가
    const savedIds = merged.map((item) => item.id);
    const maxOrder = merged.reduce((max, item) => Math.max(max, item.order), -1);
    let nextOrder = maxOrder + 1;

    for (const widget of DASHBOARD_WIDGETS) {
      if (!savedIds.includes(widget.id)) {
        merged.push({ id: widget.id, visible: true, order: nextOrder });
        nextOrder += 1;
      }
    }

    // order 기준 정렬
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}

function saveLayoutToStorage(layout: DashboardLayout): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // 저장 실패 무시
  }
}

// ============================================
// 훅
// ============================================

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    loadLayoutFromStorage()
  );

  // SSR 이후 hydration 시 localStorage 값으로 동기화


  // 위젯 표시/숨김 토글
  const toggleWidget = useCallback((id: DashboardWidgetId) => {
    setLayout((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      );
      saveLayoutToStorage(next);
      return next;
    });
  }, []);

  // 위젯 이동 (up/down)
  const moveWidget = useCallback(
    (id: DashboardWidgetId, direction: DashboardWidgetDirection) => {
      setLayout((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((item) => item.id === id);
        if (index === -1) return prev;

        const targetIndex =
          direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

        // order 값 교환
        const next = sorted.map((item) => ({ ...item }));
        const tempOrder = next[index].order;
        next[index].order = next[targetIndex].order;
        next[targetIndex].order = tempOrder;

        const result = next.sort((a, b) => a.order - b.order);
        saveLayoutToStorage(result);
        return result;
      });
    },
    []
  );

  // 기본값으로 초기화
  const resetLayout = useCallback(() => {
    saveLayoutToStorage(DEFAULT_DASHBOARD_LAYOUT);
    setLayout(DEFAULT_DASHBOARD_LAYOUT);
  }, []);

  // 레이아웃 전체를 한 번에 적용 (editor에서 일괄 반영용)
  const applyLayout = useCallback((newLayout: DashboardLayout) => {
    const normalized = newLayout.map((item, i) => ({ ...item, order: i }));
    saveLayoutToStorage(normalized);
    setLayout(normalized);
  }, []);

  // 표시된 위젯만 순서대로 반환
  const getVisibleWidgets = useCallback((): DashboardWidgetItem[] => {
    return layout
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order);
  }, [layout]);

  return {
    layout,
    toggleWidget,
    moveWidget,
    resetLayout,
    applyLayout,
    getVisibleWidgets,
  };
}
