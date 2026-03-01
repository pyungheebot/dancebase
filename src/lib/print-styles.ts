import type { CSSProperties } from "react";

// ============================================================
// 인쇄용 색상 상수
// ============================================================

export const PRINT_COLORS = {
  success: "#16a34a",
  warning: "#ca8a04",
  error: "#ef4444",
  info: "#2563eb",
  muted: "#6b7280",
  faint: "#9ca3af",
  dark: "#374151",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  headerBg: "#f3f4f6",
  rowAltBg: "#f9fafb",
  white: "#ffffff",
  black: "#000000",
  badgeBg: "#fef3c7",
  badgeText: "#92400e",
} as const;

// ============================================================
// 비율 기반 색상 반환 (출석률, 납부율 등)
// ============================================================

export function rateColor(rate: number): string {
  if (rate >= 80) return PRINT_COLORS.success;
  if (rate >= 50) return PRINT_COLORS.warning;
  return PRINT_COLORS.error;
}

// ============================================================
// 공통 테이블 스타일 팩토리
// ============================================================

export const printTableStyles = {
  th: (extra: CSSProperties = {}): CSSProperties => ({
    padding: "7px 8px",
    fontSize: "11px",
    fontWeight: "600",
    borderBottom: `2px solid ${PRINT_COLORS.borderStrong}`,
    ...extra,
  }),
  td: (extra: CSSProperties = {}): CSSProperties => ({
    padding: "6px 8px",
    fontSize: "12px",
    ...extra,
  }),
};
