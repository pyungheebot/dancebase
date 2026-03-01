import type { TeamBuildingCategory } from "@/types";
import {
  Snowflake,
  Heart,
  Lightbulb,
  MessageCircle,
  Utensils,
  TreePine,
  Sparkles,
} from "lucide-react";
import React from "react";

// ============================================================
// 카테고리 상수
// ============================================================

export const CATEGORY_LABEL: Record<TeamBuildingCategory, string> = {
  ice_breaker: "아이스브레이킹",
  trust: "신뢰 빌딩",
  creativity: "창의력",
  communication: "소통",
  party: "회식/파티",
  outdoor: "야외 활동",
  other: "기타",
};

export const CATEGORY_COLOR: Record<TeamBuildingCategory, string> = {
  ice_breaker: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  trust: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  creativity: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  communication: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  party: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  outdoor: "bg-green-100 text-green-700 hover:bg-green-100",
  other: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

export const CATEGORY_ICON: Record<TeamBuildingCategory, React.ReactNode> = {
  ice_breaker: React.createElement(Snowflake, { className: "h-3 w-3" }),
  trust: React.createElement(Heart, { className: "h-3 w-3" }),
  creativity: React.createElement(Lightbulb, { className: "h-3 w-3" }),
  communication: React.createElement(MessageCircle, { className: "h-3 w-3" }),
  party: React.createElement(Utensils, { className: "h-3 w-3" }),
  outdoor: React.createElement(TreePine, { className: "h-3 w-3" }),
  other: React.createElement(Sparkles, { className: "h-3 w-3" }),
};

// ============================================================
// 유틸리티 함수
// ============================================================

export function calcDDay(dateStr: string): string {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(dateStr);
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }
  return `${minutes}분`;
}
