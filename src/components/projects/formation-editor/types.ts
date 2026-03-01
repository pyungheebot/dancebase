// ============================================
// 포메이션 에디터 — 타입 / 상수
// ============================================

export const MEMBER_COLORS: string[] = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
];

export const QUICK_LABELS: string[] = [
  "인트로",
  "1절",
  "프리코러스",
  "후렴",
  "2절",
  "브릿지",
  "아웃트로",
  "엔딩",
];

// ============================================
// 유틸 함수
// ============================================

/** 이름에서 약자 추출 (한글 2자 / 영문 이니셜) */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (/^[가-힣]/.test(trimmed)) {
    return trimmed.slice(0, 2);
  }
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** 배경색에 따라 흰색 또는 검정 텍스트 반환 (YIQ 방식) */
export function getTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
