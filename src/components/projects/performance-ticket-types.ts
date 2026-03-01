import type { PerfAllocationStatus } from "@/types";

// ============================================================
// 상수
// ============================================================

export const TIER_COLORS = [
  { label: "보라", value: "#7c3aed" },
  { label: "파랑", value: "#2563eb" },
  { label: "하늘", value: "#0891b2" },
  { label: "초록", value: "#16a34a" },
  { label: "주황", value: "#ea580c" },
  { label: "빨강", value: "#dc2626" },
  { label: "분홍", value: "#db2777" },
  { label: "회색", value: "#6b7280" },
] as const;

export const STATUS_LABELS: Record<PerfAllocationStatus, string> = {
  reserved: "예약",
  confirmed: "확정",
  cancelled: "취소",
};

export const STATUS_COLORS: Record<PerfAllocationStatus, string> = {
  reserved: "bg-yellow-100 text-yellow-700 border-yellow-300",
  confirmed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
};

// ============================================================
// 유틸 함수
// ============================================================

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}
