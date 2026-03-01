"use client";

import React from "react";
import {
  Radio,
  AlertTriangle,
  Info,
  Siren,
  MessageSquare,
} from "lucide-react";
import type { BackstageLogCategory } from "@/types";

// ============================================================
// 카테고리 설정 타입
// ============================================================

export type CategoryConfig = {
  label: string;
  color: string;
  badgeClass: string;
  icon: React.ReactNode;
};

// ============================================================
// 카테고리 상수
// ============================================================

export const CATEGORY_CONFIG: Record<BackstageLogCategory, CategoryConfig> = {
  cue: {
    label: "큐",
    color: "blue",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Radio className="h-3 w-3" aria-hidden="true" />,
  },
  warning: {
    label: "경고",
    color: "yellow",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
  },
  info: {
    label: "정보",
    color: "green",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    icon: <Info className="h-3 w-3" aria-hidden="true" />,
  },
  emergency: {
    label: "긴급",
    color: "red",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: <Siren className="h-3 w-3" aria-hidden="true" />,
  },
  general: {
    label: "일반",
    color: "gray",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <MessageSquare className="h-3 w-3" aria-hidden="true" />,
  },
};

/** 카테고리별 막대 색상 (hex) */
export const CATEGORY_BAR_COLOR: Record<BackstageLogCategory, string> = {
  cue: "#3b82f6",
  warning: "#eab308",
  info: "#22c55e",
  emergency: "#ef4444",
  general: "#9ca3af",
};

// ============================================================
// 유틸 함수
// ============================================================

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}
